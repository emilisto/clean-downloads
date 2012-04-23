#!/usr/local/bin/node

var restler = require('restler'),
    async = require('async'),
    _ = require('underscore'),
    exec = require('child_process').exec,
    fs = require('fs'),
    Transmission = require('./transmission');

_.str = require('underscore.string');

var HOME = process.env['HOME'];
var basedir = HOME + '/Downloads';
var movedir = HOME + '/totransfer';

var transmission = new Transmission();

async.parallel({

  // 1. Find list of files to remove $(du -sm $DIR | sort -n)
  //
  //      - find all files > 100MB
  //      - filter those not accessed for a time T (specifiable through command line)
  //
  'files': function listDir(callback) {
    var minSizeM = 500;

    // Remove trailing slash
    basedir = _.str.rstrip(basedir, '/');

    var command = _.str.sprintf(
      "du -sm %s/* | sort -n | awk '{ if($1 > %d) {print $0} }'",
      basedir, minSizeM
    );

    exec(command, function(err, data) {

      var files = _(data.split('\n'))
        .map(function(line) {
          var matches = line ? line.match(/(\d+)\s+(.*)/) : null;
          return matches ? {
            size: parseInt(matches[1]),
            filename: matches[2]
          }: null;
        })
        .filter(_.identity)
        .map(function(file) {
          file.filename = file.filename.slice(basedir.length + 1);
          return file;
        });

      callback(err, files);
    });
  },

  // 2. Find all active torrents
  'torrents': function findTransfers(callback) {
    transmission.getTorrents(function(err, torrents) {
      callback(err, torrents);
    });
  }

}, function(err, result) {

  //////////////////////
  // Filter out files to move
  //
  //    - Only finished transfers, that don't have any unchecked files
  //    - All files that are not in Transmission
  //

  var files = result.files;
  var torrents = result.torrents;

  // Ignore files that are still being transferred
  var ignoreFn = function ignoreFn(torrent) {
    return torrent.haveUnchecked > 0 || !torrent.isFinished;
  };

  var ignore = _.filter(torrents, ignoreFn);
  torrents = _.reject(torrents, ignoreFn);

  // Decide which files to move, for now: all of them
  var toMove = files;

  // Filter out unfinished transfers
  var ignoreNames = _.pluck(ignore, 'filename');
  toMove = _.filter(toMove, function(file) {
    return ignoreNames.indexOf(file.filename) < 0;
  });

  var toMoveFilenames = _.pluck(toMove, 'filename');
  var torrentsToRemove = _(torrents)
    .filter(function(torrent) {
      return toMoveFilenames.indexOf(torrent.filename) >= 0;
    });

  async.series([

    // 3. Remove them from Transmission
    function removeTorrents(callback) {
      console.log(torrentsToRemove);
      transmission.removeTorrents(torrentsToRemove, callback);
    },

    // 4. Move to a new directory
    function moveFiles(callback) {
      var pathArgument = _.map(toMoveFilenames, function(filename) {
        return '"' + basedir + '/' + filename + '"';
      }).join(' ');
      var command = 'mv ' + pathArgument + ' ' + movedir;

      console.log(command);

      exec(command, function(err, data) {
        callback(null);
      });

    }
  ], function(err, data) {
    if(err) {
      console.log('error!');
      console.log(err);
    } else {
      console.log('Moved the following files to ' + movedir + ':');
      console.log(toMoveFilenames);
    }
  });

});

// 5. Mount storage volume and move it over


var restler = require('restler'),
    optimist = require('optimist'),
    async = require('async'),
    _ = require('underscore');

var Transmission = function Transmission() {
  this.config = {
    transmissionUrl: 'http://localhost:9091/transmission/rpc',
    headers: { }
  }
};

Transmission.prototype.makeRequest = function makeRequest(query, cb) {
  var self = this;
  var retries = 0;

  var _makeRequest = function() {
    if(retries > 3) throw "too many failures!";

    var req = restler.post(self.config.transmissionUrl, {
      headers: self.config.headers,
      data: JSON.stringify(query)
    });

    req.on('complete', function(data, response) {
      switch(response.statusCode) {
        case 409:
          var session_id = response.headers['x-transmission-session-id'];
          if(session_id) {
            self.config.headers['x-transmission-session-id'] = session_id;
            retries += 1;
            _makeRequest();
          } else {
            cb("didnt get a session id");
          }
          break;
        default:
          cb(null, data);
        break;
      }
    });

  };

  _makeRequest();
};

Transmission.prototype.getTorrents = function getTorrents(callback) {
  this.makeRequest({
    'method': 'torrent-get',
    'arguments': {
      'fields': [ 'downloadDir', 'isFinished', 'files', 'percentDone', 'haveUnchecked', 'id' ]
    }
  }, function(err, data) {
    // Check errors
    if(err) {
      console.log('error: ' + err);
      return;
    }

    if(data.result !== 'success') {
      console.log('error: ');
      console.log(data);
      return;
    }

    var torrents = data.arguments.torrents;

    // Extract directory names
    var directories = _(torrents)
      .map(function(torrent) {
        var firstFile = torrent.files.pop();

        return {
          id: torrent.id,
          downloadDir: torrent.downloadDir,
          filename: firstFile['name'].split('/').reverse().pop(),
          isFinished: torrent.percentDone === 1,
          haveUnchecked: torrent.haveUnchecked
        };
      });

    callback(null, directories);

    // TODO: filter out files that are not finished
  });
};

Transmission.prototype.removeTorrents = function removeTorrent(torrents, callback) {

  var ids = _.pluck(torrents, 'id');

  if(ids === 0) {
    callback("no ids specified");
    return;
  }

  this.makeRequest({
    // 'method': 'torrent-remove',
    'method': 'torrent-stop',
    'arguments': {
      ids: ids
    }
  }, function(err, data) {
    // Check errors
    if(err) {
      console.log('error: ' + err);
      return;
    }

    if(data.result !== 'success') {
      console.log('error: ');
      console.log(data);
      return;
    }

    callback(null);
  });

};

module.exports = Transmission;


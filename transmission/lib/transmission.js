var restler = require('restler'),
    _ = require('underscore');

var Transmission = module.exports = function Transmission(options) {

  options = _.extend({
    host: 'localhost:9091'
  }, options || {});

  this.config = {
    url: 'http://' + options.host + '/transmission/rpc',
    headers: { }
  }

};

Transmission.prototype.makeRequest = function makeRequest(data, callback) {
  var self = this;
  var retries = 0;

  var _makeRequest = function() {
    if(retries > 1) {
      callback(new Error("request failed"));
      return;
    }

    var req = restler.post(self.config.url, {
      headers: self.config.headers,
      data: JSON.stringify(data)
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
            callback(new Error("didnt get a session id"));
          }
          break;
        default:
          callback(null, data);
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

    if(err || data.result !== 'success') {
      callback(err || new Error(data));
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

  });
};

Transmission.prototype.removeTorrents = function removeTorrent(torrents, callback) {

  var ids = _.pluck(torrents, 'id');

  if(!ids || ids.length) {
    callback(new Error("no ids specified"));
    return;
  }

  this.makeRequest({
    'method': 'torrent-remove',
    'arguments': {
      ids: ids
    }
  }, function(err, data) {

    if(err || data.result !== 'success') {
      callback(err || new Error(data));
      return;
    }

    callback(null);
  });

};

module.exports = Transmission;


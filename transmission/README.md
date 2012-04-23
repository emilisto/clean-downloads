# node-transmission
`node-transmission` is a tiny library for communicating with
Transmission(http://www.transmissionbt.com/) BitTorrent client's RPC API.

## Usage
```js
var transmission = new Transmission();
transmission.getTorrents(function(err, torrents) {
  torrents.each(function(torrent) {

    console.dir(torrent);

  });


  transmission.removeTorrents([ torrents.pop() ], function() {
    console.log('Removed torrent!');
  });
});

```

https://trac.transmissionbt.com/browser/trunk/extras/rpc-spec.txt

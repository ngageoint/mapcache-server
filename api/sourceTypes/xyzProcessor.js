var xyzCacheGenerator = require('../xyzCacheGenerator')
  , mongoose = require('mongoose')
  , CacheModel = require('../../models/cache')
  , downloader = require('../tileDownloader')
  , config = require('../../config.json');

var mongodbConfig = config.server.mongodb;

var mongoUri = "mongodb://" + mongodbConfig.host + "/" + mongodbConfig.db;
mongoose.connect(mongoUri, {server: {poolSize: mongodbConfig.poolSize}}, function(err) {
  if (err) {
    console.log('Error connecting to mongo database, please make sure mongodb is running...');
    throw err;
  }
});
mongoose.set('debug', true);

process.on('message', function(m) {
  console.log('got a message in child process', m);
    if(m.operation == 'process') {
      processSource(m.sourceId);
    } else if(m.operation == 'generateCache') {
      createCache(m.cache, m.format);
    } else if(m.operation == 'exit') {
      process.exit();
    }
});

function downloadTile(tileInfo, tileDone) {
  CacheModel.shouldContinueCaching(tileInfo.cache, function(err, continueCaching) {
    if (continueCaching) {
      downloader.download(tileInfo, tileDone);
    } else {
      tileDone();
    }
  });
}

function createCache(cache) {
  if (!format || format == 'xyz') {
    xyzCacheGenerator.createCache(cache, downloadTile);
  }
}

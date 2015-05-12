var cacheUtilities = require('../cacheUtilities')
  , mongoose = require('mongoose')
  , CacheModel = require('../../models/cache')
  , request = require('request')
  , SourceModel = require('../../models/source')
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
      createCache(m.cache);
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
  cacheUtilities.createCache(cache, downloadTile);
}

function processSource(sourceId) {

  SourceModel.getSourceById(sourceId, function(err, source){
    if (!source) {
      console.log('did not find the source: ' + sourceId);
    }
    source.status = "Parsing GetCapabilities";
    source.complete = false;
    source.save(function(err) {
      var DOMParser = global.DOMParser = require('xmldom').DOMParser;
      var WMSCapabilities = require('wms-capabilities');
      var req = request.get({url: source.url + '?SERVICE=WMS&REQUEST=GetCapabilities'}, function(error, response, body) {
        var json = new WMSCapabilities(body).toJSON();
        source.wmsGetCapabilities = json;
        source.status = "Complete";
        source.complete = true;
        source.save(function(err) {
          process.exit();
        });
      });
    });
  });
}

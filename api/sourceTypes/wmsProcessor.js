var xyzCacheGenerator = require('../xyzCacheGenerator')
  , mongoose = require('mongoose')
  , CacheModel = require('../../models/cache')
  , request = require('request')
  , wms = require('./wms')
  , fs = require('fs-extra')
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
      createCache(m.cache, m.format);
    } else if(m.operation == 'exit') {
      process.exit();
    }
});

function downloadTile(tileInfo, tileDone) {
  console.log("tileinfo cache", tileInfo.cache);
  CacheModel.shouldContinueCaching(tileInfo.cache, function(err, continueCaching) {
    if (continueCaching) {
      wms.getTile(tileInfo.cache.source, tileInfo.z, tileInfo.x, tileInfo.y, tileInfo.cache.cacheCreationParams, function(err, tileStream) {
        var filepath = getFilepath(tileInfo);
        var dir = createDir(tileInfo.cache._id, filepath);
        var filename = getFilename(tileInfo, tileInfo.cache.source.format);
        var stream = fs.createWriteStream(dir + '/' + filename);
        stream.on('close',function(status){
          console.log('status on tile download is', status);
          CacheModel.updateTileDownloaded(tileInfo.cache, tileInfo.z, tileInfo.x, tileInfo.y, function(err) {
            tileDone(null, tileInfo);
          });
        });
        if (tileStream) {
          tileStream.pipe(stream);
        }
      });
    } else {
      tileDone();
    }
  });
}

function createCache(cache) {
  console.log("wms cache", cache);
  if (!format || format == 'xyz') {
    xyzCacheGenerator.createCache(cache, downloadTile);
  }
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

function getFilepath(tileInfo) {
	return tileInfo.z + '/' + tileInfo.x + '/' ;
}

function getFilename(tileInfo, type) {
	if (type == 'tms') {
		y = Math.pow(2,tileInfo.z) - tileInfo.y -1;
		return y + '.png';
	} else {
		return tileInfo.y + '.png';
  }
}

function createDir(cacheName, filepath){
	if (!fs.existsSync(config.server.cacheDirectory.path + '/' + cacheName +'/'+ filepath)) {
    fs.mkdirsSync(config.server.cacheDirectory.path + '/' + cacheName +'/'+ filepath, function(err){
       if (err) console.log(err);
     });
	}
  return config.server.cacheDirectory.path + '/' + cacheName +'/'+ filepath;
}

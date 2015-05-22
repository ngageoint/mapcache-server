var mongoose = require('mongoose')
  , CacheModel = require('../../models/cache')
  , shapefile = require('./shapefile')
  , shp2json = require('shp2json')
  , path = require('path')
  , fs = require('fs-extra')
  , SourceApi = require('../source')
  , turf = require('turf')
  , SourceModel = require('../../models/source')
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
  tileDone();
  // CacheModel.shouldContinueCaching(tileInfo.cache, function(err, continueCaching) {
  //   if (continueCaching) {
  //     wms.getTile(tileInfo.cache.source, tileInfo.z, tileInfo.x, tileInfo.y, tileInfo.cache.cacheCreationParams, function(err, tileStream) {
  //       var filepath = getFilepath(tileInfo);
  //       var dir = createDir(tileInfo.cache._id, filepath);
  //       var filename = getFilename(tileInfo, tileInfo.cache.source.format);
  //       var stream = fs.createWriteStream(dir + '/' + filename);
  //       stream.on('close',function(status){
  //         console.log('status on tile download is', status);
  //         CacheModel.updateTileDownloaded(tileInfo.cache, tileInfo.z, tileInfo.x, tileInfo.y, function(err) {
  //           tileDone(null, tileInfo);
  //         });
  //       });
  //       if (tileStream) {
  //         tileStream.pipe(stream);
  //       }
  //     });
  //   } else {
  //     tileDone();
  //   }
  // });
}

function createCache(cache, format) {
  console.log("shapefile cache", cache);

  CacheModel.getCacheById(cache.id, function(err, foundCache) {

    new SourceApi().getDataAsString(foundCache.source, function(err, data) {
      if (data) {
        if (!format || format == 'geojson') {
          data = JSON.parse(data);
          var gjCache = {type: "FeatureCollection",features: []};

          foundCache.totalFeatures = data.features.length;

          var poly = foundCache.geometry;
          for (var i = 0; i < data.features.length; i++) {
            var feature = data.features[i];
            var intersection = turf.intersect(poly, feature);
            if (intersection) {
              foundCache.generatedFeatures++;
              gjCache.features.push(feature);
            }
          }

          console.log(gjCache);
          var outdir = config.server.cacheDirectory.path + "/" + foundCache._id;
          var outfile = outdir + "/" + foundCache._id + ".geojson";
          fs.mkdirs(outdir, function (err) {
            if (err) return console.error(err);
            console.log("success!");

            fs.writeFile(outfile, JSON.stringify(gjCache), function(err) {
              foundCache.status.complete = true;
              foundCache.save(function() {
                CacheModel.updateFormatCreated(foundCache, 'geojson', outfile, function(err) {
                });
                console.log('saved to ' + outfile);
              });
            });
          });
        }
      }
    });
  });
}

var reader = null;

function processSource(sourceId) {
  SourceModel.getSourceById(sourceId, function(err, source){
    if (!source) {
      console.log('did not find the source: ' + sourceId);
    }
    source.status = "Parsing shapefile";
    source.complete = false;
    source.save(function(err) {
      var stream = fs.createReadStream(source.filePath);

      var dir = path.join(config.server.sourceDirectory.path, source.id);
      var fileName = path.basename(path.basename(source.filePath), path.extname(source.filePath)) + '.geojson';
      var file = path.join(dir, fileName);

    	if (!fs.existsSync(file)) {

    		var outStream = fs.createWriteStream(file);
        outStream.on('close',function(status){
          source.status = "Complete";
          source.complete = true;
          source.save(function(err) {
            console.log('wrote the file');
            process.exit();
          });
    		});
        shp2json(stream).pipe(outStream);
      }
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

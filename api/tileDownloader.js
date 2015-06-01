var request = require('request')
	, fs = require('fs-extra')
	, CacheModel = require('../models/cache')
	, wms = require('./sources/wms.js')
	, mbtiles = require('./sources/mbtiles.js')
	, geotiff = require('./sources/geotiff.js')
 	, config = require('../config.json');

exports.download = function(tileInfo, callback) {
	var filepath = getFilepath(tileInfo);
	var dir = createDir(tileInfo.cache._id, filepath);
	var filename = getFilename(tileInfo, tileInfo.cache.source.format);

	if (!fs.existsSync(dir + filename)) {

		var stream = fs.createWriteStream(dir + filename);
		stream.on('close',function(status){
			CacheModel.updateTileDownloaded(tileInfo.cache, tileInfo.z, tileInfo.x, tileInfo.y, function(err) {
			});
			callback(null, tileInfo)
		});

		if (tileInfo.cache.source.format == 'wms') {
			wms.getTile(tileInfo.cache.source, tileInfo.z, tileInfo.x, tileInfo.y, tileInfo.cache.cacheCreationParams, function(err, request) {
				request.pipe(stream);
			});
		} else if (tileInfo.cache.source.format == 'xyz' || tileInfo.cache.source.format == 'tms') {
			var url = tileInfo.cache.source.url + '/' + filepath + filename;

			console.log('downloading: '+ url + " to " + dir  + filename);

			request.get({url: url,
					headers: {'Content-Type': 'image/png'},
				})
				.on('error', function(err) {
					console.log("Error downloading tile " + url, err);

					callback(err, tileInfo);
				})
				.pipe(stream);
		} else if (tileInfo.cache.source.format == 'mbtiles') {
			mbtiles.getTile(tileInfo.cache.source, tileInfo.z, tileInfo.x, tileInfo.y, tileInfo.cache.cacheCreationParams, function(err, request) {
				request.pipe(stream);
			});
		} else if (tileInfo.cache.source.format == 'geotiff') {
			geotiff.getTile(tileInfo.cache.source, tileInfo.z, tileInfo.x, tileInfo.y, tileInfo.cache.cacheCreationParams, function(err, request) {
				if(!request) {
					return callback(null, tileInfo);
				}
				request.pipe(stream);
			});
		}
	} else {
    console.log('tile already exists ' + url + ' ' + dir + filename);
    callback(null, tileInfo);
  }
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

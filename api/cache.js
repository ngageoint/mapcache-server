var CacheModel = require('../models/cache')
  , turf = require('turf')
  , fs = require('fs-extra')
  , archiver = require('archiver')
  , config = require('../config.json')
  , tileUtilities = require('./tileUtilities')
  , sourceProcessor = require('./sourceTypes')
  , exec = require('child_process').exec
  , downloader = require('./tileDownloader');

function Cache() {
}

Cache.prototype.getAll = function(options, callback) {
  CacheModel.getCaches(callback);
}

Cache.prototype.delete = function(cache, callback) {
  CacheModel.deleteCache(cache, function(err) {
    if (err) return callback(err);
    fs.remove(config.server.cacheDirectory.path + "/" + cache.id, function(err) {
      callback(err, cache);
    });
  });
}

Cache.prototype.deleteFormat = function(cache, format, callback) {
  CacheModel.deleteFormat(cache, format, function(err) {
    if (err) return callback(err);
    var extension = "." + format;
    if (format == 'geopackage') {
      extension = '.gpkg';
    }

    fs.remove(config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + extension, function(err) {
      callback(err, cache);
    });
  });
}

Cache.prototype.create = function(cache, callback) {

  cache.status = {
    complete: false,
    totalTiles: 0,
    generatedTiles: 0,
    zoomLevelStatus: {}
  };

  var extent = turf.extent(cache.geometry);

  var totalCacheTiles = 0;

  for (var zoom = cache.minZoom; zoom <= cache.maxZoom; zoom++) {
    var yRange = tileUtilities.yCalculator(extent, zoom);
    var xRange = tileUtilities.xCalculator(extent, zoom);
    var totalTiles = (1 + (yRange.max - yRange.min)) * (1 + (xRange.max - xRange.min));
    totalCacheTiles += totalTiles;
    cache.status.zoomLevelStatus[zoom] = {
      complete: false,
      totalTiles: totalTiles,
      generatedTiles: 0
    };
  }

  cache.status.totalTiles = totalCacheTiles;

  CacheModel.createCache(cache, function(err, newCache) {
    if (err) return callback(err);
    callback(err, newCache);

    sourceProcessor.createCache(newCache);
  });
}

Cache.prototype.getZip = function(cache, minZoom, maxZoom, format, callback) {
  minZoom = Math.max(minZoom, cache.minZoom);
  maxZoom = Math.min(maxZoom, cache.maxZoom);
	if (format && (format.toLowerCase() == 'tms')) {
		//  var output = fs.createWriteStream(config.server.zipDirectory.path + "/" + cache._id+'.zip');
		var archive = archiver('zip');

  	archive.on('error', callback);

  	if (maxZoom && minZoom) {
    	convert2tms(minZoom, maxZoom);
  	} else if (!maxZoom && minZoom) {
  		zoom = fs.readdirSync(config.server.cacheDirectory.path + "/" + cache._id + '/');
  		convert2tms(minZoom, zoom[zoom.length - 1] - 1);
  	} else if (!minZoom && maxZoom) {
  		zoom = fs.readdirSync(config.server.cacheDirectory.path + "/" + cache._id + '/');
  		convert2tms(zoom[1], maxZoom);
  	} else {
  		zoom = fs.readdirSync(config.server.cacheDirectory.path + "/" + cache._id + '/');
  		convert2tms(zoom[1] , zoom[zoom.length - 1] - 1);
  	}

  	// archive.pipe(output);

  	function convert2tms(min, max){
    	for (i = min; i < max + 1; i++) {
    	 	var x = fs.readdirSync(config.server.cacheDirectory.path + "/" + cache._id + '/' + i + '/');
    	 	if (x[0] == '.DS_Store') {
    	 		x.splice(0,1);
    	 	}

  			for (k = 0; k < x.length; k++){
  				var y = fs.readdirSync(config.server.cacheDirectory.path + "/" + cache._id + '/' + i + '/' + x[k] + '/');
  				if (y[0] == '.DS_Store') {
      	 		y.splice(0,1);
      	 	}

  				for (j = 0 ; j < y.length; j++) {
  					ytemp = y[j].replace('.png','');
  					ytms = Math.pow(2,i) - ytemp -1;
  		    	archive.file(config.server.cacheDirectory.path + "/" + cache._id + '/' + i + '/'+ x[k] + '/' + ytemp + '.png', {name: i + '/' +x[k] + '/' + ytms + '.png'});
  				}
  			}
  		}
  	}
  	archive.append(JSON.stringify(cache), {name: cache._id+ ".json"});
  	archive.finalize();
    callback(null, archive);
	} else if (format && (format.toLowerCase() == 'xyz')) {
		 var archive = archiver('zip');
    	archive.on('error', function(err){
    	    throw err;});

    	var zoom = [];
    	if (maxZoom && minZoom){
	    	for(i = 0; i < maxZoom-minZoom+1; i++){
	    		zoom[i] = minZoom + i + '/**';}
    	}else if (!maxZoom && minZoom){
    		for(i = 0; i < 17 ; i++){
	    		zoom[i] = minZoom + i + '/**';}
    	}else if (!minZoom && maxZoom){
    		for(i = 0; i < maxZoom + 1 ; i++){
	    		zoom[i] = i + '/**';}
    	}else{ zoom = ['**']}

    	archive.bulk([{ expand: true, cwd: config.server.cacheDirectory.path + "/" + cache._id, src: zoom}]);
    	archive.append(JSON.stringify(cache), {name: cache._id+ ".json"});
    	archive.finalize();
      callback(null, archive);
	} else if (format && (format.toLowerCase() == 'geopackage')) {

    var geoPackageFile = config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".gpkg";
    if (!fs.existsSync(geoPackageFile)) {
      var python = exec(
       './utilities/tiles2gpkg_parallel.py -tileorigin ul -srs 3857 ' + config.server.cacheDirectory.path + "/" + cache._id + " " + geoPackageFile,
       function(error, stdout, stderr) {
         CacheModel.updateFormatCreated(cache, format, geoPackageFile, function(err) {
           var stream = fs.createReadStream(geoPackageFile);
           callback(null, stream);
         });
       });
     } else {
       var stream = fs.createReadStream(geoPackageFile);
       callback(null, stream);
     }
	} else if (format && (format.toLowerCase() == 'mbtiles')) {

    var mbtilesFile = config.server.cacheDirectory.path + "/" + cache._id + "/" + cache._id + ".mbtiles";
    if (!fs.existsSync(mbtilesFile)) {
      console.log('running ' + 'mb-util ' + config.server.cacheDirectory.path + "/" + cache._id + " " + mbtilesFile);
      var python = exec(
       'mb-util ' + config.server.cacheDirectory.path + "/" + cache._id + " " + mbtilesFile,
       function(error, stdout, stderr) {
         console.log('done running ' + 'mb-util ' + config.server.cacheDirectory.path + "/" + cache._id + " " + mbtilesFile);
         CacheModel.updateFormatCreated(cache, format, mbtilesFile, function(err) {
           console.log('updated format created');
           var stream = fs.createReadStream(mbtilesFile);
           callback(null, stream);
         });
       });
     } else {
       var stream = fs.createReadStream(mbtilesFile);
       callback(null, stream);
     }
	}
}

module.exports = Cache;

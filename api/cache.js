var CacheModel = require('../models/cache')
  , async = require('async')
  , turf = require('turf')
  , fs = require('fs-extra')
  , archiver = require('archiver')
  , config = require('../config.json')
  , downloader = require('./tileDownloader');

Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

function xCalculator(bbox,z) {
		var x = [];
		var x1 = getX(Number(bbox[0]), z);
		var x2 = getX(Number(bbox[2]), z);
		x.max = Math.max(x1, x2);
		x.min = Math.min(x1, x2);
		if (z == 0){
			x.current = Math.min(x1, x2);
		}
		return x;
	}

	function yCalculator(bbox,z) {
		var y = [];
		var y1 = getY(Number(bbox[1]), z);
		var y2 = getY(Number(bbox[3]), z);
		y.max = Math.max(y1, y2);
		y.min = Math.min(y1, y2);
		y.current = Math.min(y1, y2);
		return y;
	}

  function getX(lon, zoom) {
		var xtile = Math.floor((lon + 180) / 360 * (1 << zoom));
		return xtile;
	}

	function getY(lat, zoom) {
		var ytile = Math.floor((1 - Math.log(Math.tan(Math.radians(parseFloat(lat))) + 1 / Math.cos(Math.radians(parseFloat(lat)))) / Math.PI) /2 * (1 << zoom));
		return ytile;
	}

function pushNextTileTasks(q, cache, zoom, x, yRange, numberOfTasks) {
  console.log('pushing next ' + numberOfTasks + ' for ' + yRange + ' and x: ' + x + ' and zoom: ' + zoom, cache);
  if (yRange.current > yRange.max) return false;
  for (var i = yRange.current; i <= yRange.current + numberOfTasks && i <= yRange.max; i++) {
    q.push({z:zoom, x: x, y: i, cache: cache});
  }
  yRange.current = yRange.current + numberOfTasks;
  return true;
}

function Cache() {
}

Cache.prototype.getAll = function(options, callback) {

  CacheModel.getCaches(callback);

}

Cache.prototype.create = function(cache, callback) {
  CacheModel.createCache(cache, function(err, newCache) {
    if (err) return callback(err);
    callback(err, newCache);

    var zoom = cache.minZoom;
    var extent = turf.extent(cache.geometry);

    async.whilst(
        function () {
          return zoom <= cache.maxZoom;
        },
        function (zoomLevelDone) {
          var yRange = yCalculator(extent, zoom);
          var xRange = xCalculator(extent, zoom);

          var currentx = xRange.min;

          async.whilst(
            function () {
              console.log('current x ' + currentx + ' xrange max ' + xRange.max);
              return currentx <= xRange.max;
            },
            function(xRowDone) {
              var q = async.queue(function (task, tileDone) {
                console.log("go get the tile", task);
                  downloader.download(task, tileDone);
              }, 10);

              q.drain = function() {
                  // now go get the next 10 ys and keep going
                  var tasksPushed = pushNextTileTasks(q, newCache, zoom, currentx, yRange, 10);
                  // if there are no more ys do the callback
                  console.log("q drained");
                  if (!tasksPushed) {
                    console.log("x row " + currentx + " is done");
                    currentx++;
                    yRange.current = yRange.min;
                    xRowDone();
                  }
              }

              pushNextTileTasks(q, newCache, zoom, currentx, yRange, 10);

            },
            function (err) {
              console.log('zoom level ' + zoom + ' is done', err);
              zoom++;
              zoomLevelDone();
            }
          );
        },
        function (err) {
            console.log("done with all the zoom levels");
        }
    );
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
	} else {
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
	}
}

module.exports = Cache;

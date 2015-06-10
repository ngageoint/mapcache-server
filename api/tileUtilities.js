var request = require('request')
	, fs = require('fs-extra')
	, turf = require('turf')
	, async = require('async')
	, xyzTileWorker = require('./xyzTileWorker')
	, geojsonvt = require('geojson-vt')
	, path = require('path')
	, CacheModel = require('../models/cache')
	, Readable = require('stream').Readable
 	, config = require('../config.json');

Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

function tile2lon(x,z) {
  return (x/Math.pow(2,z)*360-180);
}

function tile2lat(y,z) {
  var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
  return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
}

exports.tileBboxCalculator = function(x, y, z) {
  console.log('tile box calculator for ' + x + ' ' + y + ' ' + z);
  x = Number(x);
  y = Number(y);
  var tileBounds = {
    north: tile2lat(y, z),
    east: tile2lon(x+1, z),
    south: tile2lat(y+1, z),
    west: tile2lon(x, z)
  };

  return tileBounds;
}

exports.xCalculator = function(bbox,z) {
	var x = [];
	var x1 = exports.getX(Number(bbox[0]), z);
	var x2 = exports.getX(Number(bbox[2]), z);
	x.max = Math.max(x1, x2);
	x.min = Math.min(x1, x2);
	if (z == 0){
		x.current = Math.min(x1, x2);
	}
	return x;
}

exports.yCalculator = function(bbox,z) {
	var y = [];
	var y1 = exports.getY(Number(bbox[1]), z);
	var y2 = exports.getY(Number(bbox[3]), z);
	y.max = Math.max(y1, y2);
	y.min = Math.min(y1, y2);
	y.current = Math.min(y1, y2);
	return y;
}

exports.getX = function(lon, zoom) {
	var xtile = Math.floor((lon + 180) / 360 * (1 << zoom));
	return xtile;
}

exports.getY = function(lat, zoom) {
	var ytile = Math.floor((1 - Math.log(Math.tan(Math.radians(parseFloat(lat))) + 1 / Math.cos(Math.radians(parseFloat(lat)))) / Math.PI) /2 * (1 << zoom));
	return ytile;
}

exports.generateMetadataTiles = function(source, file, callback) {
	source.status.message = "Generating metadata tiles";
	console.log('wrote the file');
	fs.readFile(file, function(err, fileData) {
	var gjData = JSON.parse(fileData);
	delete fileData;
		var geometry = turf.envelope(gjData);
		source.geometry = geometry;
		source.properties = [];
		var allProperties = {};
		for (var i = 0; i < gjData.features.length; i++) {
			var feature = gjData.features[i];
			for (var property in feature.properties) {
				allProperties[property] = allProperties[property] || {key: property, values:[]};
				if (allProperties[property].values.indexOf(feature.properties[property]) == -1) {
					allProperties[property].values.push(feature.properties[property]);
				}
			}
		}
		for (var property in allProperties) {
			source.properties.push(allProperties[property]);
		}

		source.style = {
			defaultStyle: {
				style: {
					'fill': "#000000",
					'fill-opacity': 0.5,
					'stroke': "#0000FF",
					'stroke-opacity': 1.0,
					'stroke-width': 1
				}
			},
			styles: []
		};
		source.save(function(err) {

			var tileIndex = geojsonvt(gjData, {
				indexMaxZoom: 18,
				maxZoom: 18
			});
			delete gjData;
			console.log("tile index tiles", tileIndex.tiles);

			async.forEachOfLimit(tileIndex.tiles, 2, function(tile, key, callback) {
				console.log('going to get tile ', tile.z2, tile.x, tile.y);
				var zoom = 0;
				if (tile.z2 != 0) {
					var shifting = tile.z2;
					while(shifting > 1) {
						zoom++;
						shifting = shifting/2;
						console.log('zoom is ' + zoom + ' shifting is ' + shifting);
					}
				}
				exports.writeVectorTile(tileIndex.getTile(zoom, tile.x, tile.y), source, zoom, tile.x, tile.y, function() {
					console.log('wrote tile %d, %d, %d', zoom, tile.x, tile.y);
					callback();
				});
			}, function(err) {
				source.status.complete = true;
				source.status.message = "Complete";
				source.save(function() {
					callback(null, source);
				});
			});
			// for (var key in tileIndex.tiles) {
			// 	var tile = tileIndex.tiles[key];
			// 	// console.log('tile features ', tile.features);
			// 	// exports.writeVectorTile(tile, source, tile.z2/2, tile.x, tile.y, function() {
			// 	//
			// 	// });
			// }

			// xyzTileWorker.createXYZTiles(source, 0, 0, function(tileInfo, tileDone) {
			// 	console.log('get the shapefile tile %d, %d, %d', tileInfo.z, tileInfo.x, tileInfo.y);
			// 	var dir = path.join(config.server.sourceDirectory.path, source.id.toString(), 'tiles', tileInfo.z.toString(), tileInfo.x.toString());
			//   var file = path.join(dir, tileInfo.y.toString()+'.json');
			//
			//   if (!fs.existsSync(file)) {
			// 		var tile = tileIndex.getTile(Number(tileInfo.z), Number(tileInfo.x), Number(tileInfo.y));
			// 		if (tile) {
			// 			exports.writeVectorTile(tile, source, tileInfo.z, tileInfo.x, tileInfo.y, function() {
			// 				// delete tileIndex.tiles[(((1 << tileInfo.z) * tileInfo.y + tileInfo.x) * 32) + tileInfo.z];
			// 				return tileDone();
			// 			});
			// 		} else {
			// 			return tileDone();
			// 		}
			// 	} else {
			// 		console.log('tile exists');
			// 		return tileDone();
			// 	}
			// }, function(source, continueCallback) {
			// 	continueCallback(null, true);
			// }, function(source, zoom, zoomDoneCallback) {
			// 	source.status.message="Processing " + ((zoom/6)*100) + "% complete";
			// 	source.save(function() {
			// 		zoomDoneCallback();
			// 	});
			// }, function(err, cache) {
			// 	source.status.complete = true;
			// 	source.status.message = "Complete";
			// 	source.save(function() {
			// 		callback(null, source);
			// 	});
			// });
		});
	});
}

exports.writeVectorTile = function(tile, source, z, x, y, callback) {
  var dir = path.join(config.server.sourceDirectory.path, source.id.toString(), 'tiles', z.toString(), x.toString());
  var file = path.join(dir, y.toString()+'.json');

  if (!fs.existsSync(file)) {
    fs.mkdirsSync(dir, function(err){
       if (err) console.log(err);
     });

		fs.writeFile(file, JSON.stringify(tile), function (err) {
		  if (err) return console.log(err);
		  callback(null);
		});

  } else {
    callback(null);
  }
}

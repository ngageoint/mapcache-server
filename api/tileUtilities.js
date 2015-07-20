var request = require('request')
	, fs = require('fs-extra')
	, async = require('async')
	, turf = require('turf')
	, xyzTileWorker = require('./xyzTileWorker')
	, geojsonvt = require('geojson-vt')
	, path = require('path')
	, Canvas = require('canvas')
	, Image = Canvas.Image
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

exports.generateMetadataTiles = function(source, gjData, callback) {
	source.status.message = "Generating metadata tiles";
	console.time('getting geometry');
	var geometry = turf.envelope(gjData);
	console.timeEnd('getting geometry');
	source.geometry = geometry;

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
	console.log('saving the source and then generating tile index');
	source.save(function() {
		console.log('generate tile index');
		console.time('generate tile index');
		getTileIndexFromData(source.id, gjData, function(err, tileIndex) {
			console.timeEnd('generate tile index');
			delete gjData;

			xyzTileWorker.createXYZTiles(source, 0, 5, function(tileInfo, tileDone) {
				var dir = path.join(config.server.sourceDirectory.path, source.id.toString(), 'tiles', tileInfo.z.toString(), tileInfo.x.toString());
				var file = path.join(dir, tileInfo.y.toString()+'.json');

				if (!fs.existsSync(file)) {
					var tile = tileIndex.getTile(Number(tileInfo.z), Number(tileInfo.x), Number(tileInfo.y));
					if (tile) {
						exports.writeVectorTile(tile, source, tileInfo.z, tileInfo.x, tileInfo.y, function() {
							// delete tileIndex.tiles[(((1 << tileInfo.z) * tileInfo.y + tileInfo.x) * 32) + tileInfo.z];
							return tileDone();
						});
					} else {
						return tileDone();
					}
				} else {
					return tileDone();
				}
			}, function(source, continueCallback) {
				continueCallback(null, true);
			}, function(source, zoom, zoomDoneCallback) {
				source.status.message="Processing " + ((zoom/6)*100) + "% complete";
				source.save(function() {
					zoomDoneCallback();
				});
			}, function(err, cache) {
				source.status.complete = true;
				source.status.message = "Complete";
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
				source.save(function() {
					console.log('Source is complete', source.name);
					callback(null, source);
				});
			});
		});
	});
}

exports.getFeatures = function(source, west, south, east, north, zoom, callback) {
	var queryRegion = turf.bboxPolygon([Number(west), Number(south), Number(east), Number(north)]);
	var point = turf.centroid(queryRegion);

	var extent = turf.extent(point);
	var yRange = exports.yCalculator(extent, zoom);
	var xRange = exports.xCalculator(extent, zoom);
	var x = xRange.min;
	var y = yRange.min;

	var tileIndex = geojsonvt(queryRegion, {
		indexMaxZoom: Number(zoom),
		maxZoom: Number(zoom)
	});
	var tile = tileIndex.getTile(Number(zoom), Number(x), Number(y));
	var queryPoly = turf.polygon([tile.features[0].geometry[0]]);
	var queryPoint = turf.centroid(queryPoly);


	var file = path.join(config.server.sourceDirectory.path, source.id.toString(), 'tiles', zoom.toString(), x.toString(), y.toString()+'.json');
	if (source.source) {
		file = path.join(config.server.cacheDirectory.path, source.id.toString(), 'tiles', zoom.toString(), x.toString(), y.toString()+'.json');
	}
	if (fs.existsSync(file)) {
		fs.readFile(file, function(err, fileData) {
			var gjData = JSON.parse(fileData);

			var featureList = [];
			for (var i = 0; i < gjData.features.length; i++) {
				var feature = gjData.features[i];
				var f = {type: 'Feature', properties: feature.tags, geoType: feature.type, geometry: feature.geometry};
				for (var g = 0; g < feature.geometry.length; g++) {
					var innerGeometry = feature.geometry[g];


					try {

						if (feature.type == 1) {
							//Point
							var featurePoint = turf.point(innerGeometry);
							if (turf.inside(featurePoint, queryPoly)) {
								featureList.push(f);
							}
						} else if (feature.type == 3) {
							// Polygon
							var turfPoly = turf.polygon([innerGeometry]);
							if (turf.inside(queryPoint, turfPoly)) {
								featureList.push(f);
							} else {
								if(turf.intersect(queryPoly, turfPoly)) {
									featureList.push(f);
								}
							}
						} else if (feature.type == 2) {
							// Linestring
							var turfLine = turf.linestring(innerGeometry);
							var closestPointOnLine = turf.pointOnLine(turfLine, queryPoint);
							if (turf.inside(closestPointOnLine, queryPoly)) {
								featureList.push(f);
							}
						}
					} catch (e) {
						console.log('error turfing', e);
					}
				}
			}

			featureList = featureList.sort(function (a, b) {
				if (a.geoType === 1 && b.geoType === 1) {
					var aDistance = turf.distance(turf.point(a.geometry[0]), queryPoint);
					var bDistance = turf.distance(turf.point(b.geometry[0]), queryPoint);
					if (aDistance < bDistance) return -1;
					if (bDistance > aDistance) return 1;
					return 0;
				} else if (a.geoType === 1) {
					return -1;
				} else if (b.geoType === 1) {
					return 1;
				}

				return 0;
			});
			callback(null, featureList.length == 0 ? null : featureList);
		});
	}
}

exports.writeVectorTile = function(tile, source, z, x, y, callback) {
	var dir = path.join(config.server.sourceDirectory.path, source.id.toString(), 'tiles', z.toString(), x.toString());

	if (source.source) {
		// this is a cache
		dir = path.join(config.server.cacheDirectory.path, source.id.toString(), 'tiles', z.toString(), x.toString());

	}
  var file = path.join(dir, y.toString()+'.json');

  if (!fs.existsSync(file)) {
    fs.mkdirsSync(dir, function(err){
       if (err) console.log(err);
     });

		console.time('writing tile' + z + ' ' + x + ' ' + y);

		var writeStream = fs.createWriteStream(file);
		writeStream.on('finish', function() {
			console.timeEnd('writing tile' + z + ' ' + x + ' ' + y);
			callback(null);
		});

		writeStream.write('{"features":[');
		for (var i = 0; i < tile.features.length; i++) {
			var feature = tile.features[i];
			// console.log('feature', feature);
			writeStream.write('{');
			writeStream.write('"type":'+feature.type+',');
			if (feature.tags) {
				writeStream.write('"tags":'+JSON.stringify(feature.tags)+',');
			}
			if (feature.geometry) {
				writeStream.write('"geometry":[');
				for (var g = 0; g < feature.geometry.length; g++) {
					var geometry = feature.geometry[g];
					writeStream.write(JSON.stringify(geometry));
					if (g < (feature.geometry.length -1)) {
						writeStream.write(',');
					}
				}
			}
			writeStream.write(']');

			writeStream.write('}');

			if (i < (tile.features.length -1)) {
				writeStream.write(',');
			}
		}
		writeStream.write(']}');
		writeStream.end();

  } else {
    callback(null);
  }
}

exports.getVectorTile = function(source, format, z, x, y, params, callback) {
	var file = path.join(config.server.sourceDirectory.path, source.id.toString(), 'tiles', z.toString(), x.toString(), y.toString()+'.json');
	if (source.source) {
			// this means it is a cache
			file = path.join(config.server.cacheDirectory.path, source.id.toString(), 'tiles', z.toString(), x.toString(), y.toString()+'.json');
	}
  if (fs.existsSync(file)) {
    var tile = "";
    var stream = fs.createReadStream(file);

    if (format == 'json' || format == 'geojson') {
      return callback(null, stream);
    }

    stream.on('data', function(chunk) {
      tile = tile + chunk;
    });

    stream.on('end', function(chunk) {
      console.log('sending back tile ', file);
      try {
      var tileData = JSON.parse(tile.replace(/\bNaN\b/g, "null"));
      if (format == 'png') {
        return exports.createImage(tileData, source.style, z, x, y, callback);
      } else {
        return callback(null);
      }
    } catch (e) {
      console.log('error with tile ', file);
			console.log(tile);
			console.log(e);
			return fs.remove(file, function(err) {
				if (err) {
					return callback(null);
				} else {
					return exports.getVectorTile(source, format, z, x, y, params, callback);
				}
			});
    }
    });
  } else {
		var dir = path.join(config.server.sourceDirectory.path, source.id);
		var fileName = path.basename(path.basename(source.filePath), path.extname(source.filePath)) + '.geojson';

		if (source.source) {
				// this means it is a cache
				dir = path.join(config.server.cacheDirectory.path, source.id);
				fileName = source.id + '.geojson';
		}
    var file = path.join(dir, fileName);
		console.log('file', file);

		getTileIndex(source.id, file, function(err, tileIndex) {
			if (!tileIndex) return exports.createImage(null, source.style, z, x, y, callback);
			var tile = tileIndex.getTile(Number(z), Number(x), Number(y));
			if (!tile) return exports.createImage(null, source.style, z, x, y, callback);
			exports.writeVectorTile(tile, source, z, x, y, function() {
				return exports.getVectorTile(source, format, z, x, y, params, callback);
			});
		});
  }
}

var tileIndexes = {};
var tileIndexOrder = [];

function getTileIndex(id, dataLocation, callback) {
	if (tileIndexes[id]) {
		tileIndexes[id].accessTime = Date.now();
		tileIndexOrder = tileIndexOrder.sort(tileIndexSort);
		return callback(null,tileIndexes[id].index);
	}
	if (fs.existsSync(dataLocation)) {
		fs.readFile(dataLocation, {encoding: 'utf8'}, function(err, fileData) {
			if (!fileData || err) callback(null);
			var gjData = JSON.parse(fileData.replace(/\bNaN\b/g, "null"));
			return getTileIndexFromData(id, gjData, callback);
		});
	} else {
		callback(null);
	}
}

function getTileIndexFromData(id, data, callback) {
	if (tileIndexes[id]) {
		tileIndexes[id].accessTime = Date.now();
		tileIndexOrder = tileIndexOrder.sort(tileIndexSort);
		return callback(null,tileIndexes[id].index);
	}
	if (tileIndexOrder.length >= 3) {
		delete tileIndexes[tileIndexOrder.pop()];
	}
	tileIndexes[id] = {
		index: geojsonvt(data,{
			indexMaxZoom: 0,
			maxZoom: 18
		}),
		accessTime: Date.now()
	};
	tileIndexOrder.push(id);
	tileIndexOrder = tileIndexOrder.sort(tileIndexSort);

	return callback(null, tileIndexes[id].index);
}

function tileIndexSort(a,b) {
	if (tileIndexes[a].accessTime < tileIndexes[b].accessTime) {
		return -1;
	}
	if (tileIndexes[b].accessTime < tileIndexes[a].accessTime) {
		return 1;
	}
	return 0;
}

exports.createImage = function(tile, style, z, x, y, callback) {
  var canvas = new Canvas(256,256);
  var ctx = canvas.getContext('2d');
  var padding = 0;
  totalExtent = 4096 * (1 + padding * 2),
  height = canvas.height = canvas.width,
  ratio = height / totalExtent,
  pad = 4096 * padding * ratio;

  ctx.clearRect(0, 0, height, height);

/**
Begin testing for layering data on images

	var req = request.get({url: 'http://osm.geointapps.org/osm/'+z+'/'+x+'/'+y+'.png',
		headers: {'Content-Type': 'image/png'},
		encoding: null
	}, function(err, response, squid) {
		if (err){
			console.log('error in testing', err);
		}



	  if (err) throw err;
	  img = new Image;
	  img.src = squid;
	  ctx.drawImage(img, 0, 0, img.width, img.height);

		end testing for layering data on images
		*/

		if (tile && tile.features) {
			var features = tile.features;
		  ctx.lineWidth = 1;
		  ctx.strokeStyle = 'red';
		  ctx.fillStyle = 'rgba(255,0,0,0.05)';

		  for (var i = 0; i < features.length; i++) {
		      var feature = features[i],
		          type = feature.type;

		      ctx.beginPath();

		      for (var j = 0; j < feature.geometry.length; j++) {
		          var geom = feature.geometry[j];
		          if (type === 1) {
		              ctx.arc(geom[0] * ratio + pad, geom[1] * ratio + pad, 2, 0, 2 * Math.PI, false);
		              continue;
		          }

		          for (var k = 0; k < geom.length; k++) {
		              var p = geom[k];
		              if (p[0] == null || p[1] == null) continue;
		              if (k) ctx.lineTo(p[0] * ratio + pad, p[1] * ratio + pad);
		              else ctx.moveTo(p[0] * ratio + pad, p[1] * ratio + pad);
		          }
		      }
		      var styles = styleFunction(feature, style);
		      if (styles) {
		        var rgbFill = hexToRgb(styles.fillColor);
		        ctx.fillStyle = "rgba("+rgbFill.r+","+rgbFill.g+","+rgbFill.b+","+styles.fillOpacity+")";
		        ctx.lineWidth = styles.weight;
		        var rgbStroke = hexToRgb(styles.color);
		        ctx.strokeStyle = "rgba("+rgbStroke.r+","+rgbStroke.g+","+rgbStroke.b+","+styles.opacity+")";
						// this is how you can add text.  very bad implementation though, just adds the text to every feature
						// at the first point of that feature
						/*
						ctx.font = "12px sans-serif";
						var textLocation = feature.geometry[0][0];
  					ctx.fillText(feature.tags[style.title], textLocation[0]*ratio + pad, textLocation[1]*ratio + pad);
						*/
		      }
		      if (type === 3 || type === 1) ctx.fill('evenodd');
		      ctx.stroke();
		  }
		}
	  callback(null, canvas.pngStream());

		/*
	});
	*/
}

function styleFunction(feature, style) {
  if (!style) return null;
  if (style.styles) {
    var sorted = style.styles.sort(styleCompare);
    for (var i = 0; i < sorted.length; i++) {
      var styleProperty = sorted[i];
      var key = styleProperty.key;
      if (feature.tags && feature.tags[key]) {
        if (feature.tags[key] == styleProperty.value) {
          return {
            color: styleProperty.style['stroke'],
            fillOpacity: styleProperty.style['fill-opacity'],
            opacity: styleProperty.style['stroke-opacity'],
            weight: styleProperty.style['stroke-width'],
            fillColor: styleProperty.style['fill']
          };
        }
      }
    }
  }
  var defaultStyle = style.defaultStyle;
  if (!defaultStyle) {
    return null;
  }

  return {
    color: defaultStyle.style['stroke'],
    fillOpacity: defaultStyle.style['fill-opacity'],
    opacity: defaultStyle.style['stroke-opacity'],
    weight: defaultStyle.style['stroke-width'],
    fillColor: defaultStyle.style['fill']
  }
}

function styleCompare(a, b) {
  if (a.priority < b.priority) {
    return -1;
  }
  if (a.priority > b.priority) {
    return 1;
  }
  // a must be equal to b
  return 0;
}

function hexToRgb(hex) {
  var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
  } : null;
}

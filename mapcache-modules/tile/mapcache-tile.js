var fs = require('fs-extra')
	, path = require('path')
	, turf = require('turf')
	, Canvas = require('canvas')
	, Readable = require('stream').Readable
	, xyzTileUtils = require('xyz-tile-utils')
	, Image = Canvas.Image
	, async = require('async')
	, config = require('mapcache-config')
	, mapcacheModels = require('mapcache-models')
	, SourceModel = mapcacheModels.Source
	, FeatureModel = mapcacheModels.Feature;

exports.getFeatures = function(source, west, south, east, north, zoom, callback) {
	FeatureModel.findFeaturesBySourceIdWithin(source.id, west, south, east, north, 4326, callback);
}

function tileContainsData(source, bbox) {
	var bufferedBox = {
		west: Math.max(-180, bbox.west - Math.abs((bbox.east - bbox.west) * .02)),
		south: Math.max(-85, bbox.south - Math.abs((bbox.north - bbox.south) * .02)),
		east: Math.min(180, bbox.east + Math.abs((bbox.east - bbox.west) * .02)),
		north: Math.min(85, bbox.north + Math.abs((bbox.north - bbox.south) * .02))
	};
	console.log('buffered box', bufferedBox);
	console.log('source geom', source.geometry);
	if (source.geometry && !turf.intersect(turf.bboxPolygon([bufferedBox.west, bufferedBox.south, bufferedBox.east, bufferedBox.north]), source.geometry.geometry)) {
		console.log("No data, returning early");
		return false;
	}
	return true;
}

exports.getVectorTile = function(source, format, z, x, y, params, callback) {
	console.log('getting vector tile %d %d %d', z, x, y);
	var bbox = xyzTileUtils.tileBboxCalculator(x, y, z);

	if (!tileContainsData(source.source ? source.source : source, bbox)) {
		console.log("No data, returning early");
		return callback(null, null);
	}

	// use the style time to determine if there has already been an image created for this source and style
	var imageTile = path.join(config.server.sourceDirectory.path, source.id.toString(), 'prebuilt-'+source.styleTime, z.toString(), x.toString(), y.toString()+'.'+format);
	if (source.source) {
		imageTile = path.join(config.server.cacheDirectory.path, source.id.toString(), 'prebuilt-'+source.styleTime, z.toString(), x.toString(), y.toString()+'.'+format);
	}
	if (params && !params.noCache && fs.existsSync(imageTile)) {
		console.log('pulling tile from prebuilt', imageTile);
		return callback(null, fs.createReadStream(imageTile));
	} else {
		console.log('getting tile from db', imageTile);
		if (source.source) {
			FeatureModel.fetchTileForCacheId(source.id, bbox, z, function(err, tile) {
				handleTileData(tile, format, source.source, imageTile, callback);
			});
		} else {
			FeatureModel.fetchTileForSourceId(source.id, bbox, z, format == 'geojson' ? '4326' : 'vector', function(err, tile) {
				console.log('err fetching tile? ', err);
				// console.log('tile is', tile);
				handleTileData(tile, format, source, imageTile, callback);
			});
		}
	}
}

function handleTileData(tile, format, source, imageTile, callback) {
	try {
		if (format == 'png') {
			return exports.createImage(tile, source.style, function(err, pngStream) {
				var size = 0;
				var done = true;
				// pngStream.on('data', function(chunk) {
				// 	size += chunk.length;
				// });
				// pngStream.on('end', function() {
				// 	if (!done && source){
				// 		// SourceModel.updateSourceAverageSize(source, size, function(err) {
				// 		// });
				// 		done = true;
				// 	}
				// });


				// fs.mkdirsSync(path.dirname(imageTile), function(err){
				// 	 if (err) console.log(err);
				//  });
				// var tileWriter = fs.createWriteStream(imageTile);
				// pngStream.pipe(tileWriter);
				return callback(err, pngStream);
			});
		} else if (format == 'geojson') {
			var s = new Readable();
			var features = tile;
			console.log('there are %d features', features.length);
			for (var i = 0; i < features.length; i++) {
				var feature = features[i];
				console.log('feature', feature);
				feature.geometry = JSON.parse(feature.geometry);
				if (i) s.push(',');
				s.push(JSON.stringify(feature));
			}
			s.push(null);
			console.log('done');
			return callback(null, s);
		} else {
			return callback(null);
		}
	} catch (e) {
		// console.log('error with tile ', tile);
		// console.log(tile);
		console.log(e);
		throw e;
	}
}

exports.createImage = function(tile, style, callback) {
	var canvases = {};

	console.time('creating image');
	// console.time('creating image for tile', tile);
	var ratio = 256 / 4096;
	var features = tile;
	console.log('creating image with %d features', features.length);

	var points = 0;
	var drawnFeatures = 0;

	async.eachSeries(features, function(geoJsonFeature, callback) {
		async.setImmediate(function () {
			var feature = JSON.parse(geoJsonFeature.geometry);
			var type = feature.type;
			var ctx;
			var styles = styleFunction(geoJsonFeature, style);
			// console.log('styles.styleId', styles.styleId);
	    if (styles && !canvases[styles.styleId]) {
				var canvas = new Canvas(256,256);
			  var ctx = canvas.getContext('2d');
				canvases[styles.styleId] = {canvas: canvas, ctx: ctx};
	      var rgbFill = hexToRgb(styles.fillColor);
	      ctx.fillStyle = "rgba("+rgbFill.r+","+rgbFill.g+","+rgbFill.b+","+styles.fillOpacity+")";
	      ctx.lineWidth = styles.weight;
	      var rgbStroke = hexToRgb(styles.color);
	      ctx.strokeStyle = "rgba("+rgbStroke.r+","+rgbStroke.g+","+rgbStroke.b+","+styles.opacity+")";
				console.log('styles fill color', styles.fillColor);
				console.log('rgbfill', rgbFill);
				console.log('styles color', styles.color);
				console.log('rgbstroke', rgbStroke);
	    } else {
				ctx = canvases[styles.styleId].ctx;
			}

	    ctx.beginPath();

	    var geom = feature.coordinates;

	    if (type === 'Point' && points < 10000) {
				points++;
				drawnFeatures++;
	      drawPoint(geom, ctx, ratio);
	    } else if (type === 'MultiPoint') {
				drawnFeatures++;
				for (var point = 0; point < geom.length; point++) {
					drawPoint(geom[point], ctx, ratio);
				}
			} else if (type === 'LineString') {
				drawnFeatures++;
				drawLine(geom, ctx, ratio);
			} else if (type === 'MultiLineString') {
				drawnFeatures++;
				for (var line = 0; line < geom.length; line++) {
					drawLine(geom[line], ctx, ratio);
				}
			} else if (type === 'Polygon') {
				drawnFeatures++;
				drawPolygon(geom, ctx, ratio);
			} else if (type === 'MultiPolygon') {
				drawnFeatures++;
				for (var poly = 0; poly < geom.length; poly++) {
					drawPolygon(geom[poly], ctx, ratio);
				}
			}

			if (type == 'Polygon' || type == 'MultiPolygon' || type == 'Point') {
				ctx.fill('evenodd');
			}
	    ctx.stroke();
			callback();
		});
	}, function() {
		var finalCanvas = new Canvas(256,256);
		var finalCtx = finalCanvas.getContext('2d');
		async.forEachOfSeries(canvases, function(canvas, key, callback) {
			var img = new Image;

			img.onload = function() {
				console.log('img height %d img width %d', img.height, img.width);
				finalCtx.drawImage(img, 0, 0, 256, 256);
				callback();
			};
			img.src = canvases[key].canvas.toBuffer();
		}, function() {
			console.timeEnd('creating image');
			console.log('finished creating image with %d features', drawnFeatures);

		  callback(null, finalCanvas.pngStream());
		});
	});

}

function drawPoint(point, ctx, ratio) {
	ctx.arc(~~(point[0] * ratio), ~~(256-(point[1] * ratio)), 2, 0, 2 * Math.PI, false);
}

function drawLine(line, ctx, ratio) {
	var move = true;
	for (var k = 0; k < line.length; k++) {
		var coord = line[k];
		if (coord[0] == null || coord[1] == null) continue;

		if (!move) {
			ctx.lineTo(~~(coord[0] * ratio), ~~(256-(coord[1] * ratio)));
		}	else {
			ctx.moveTo(~~(coord[0] * ratio), ~~(256-(coord[1] * ratio)));
			move = false;
		}
	}
}

function drawPolygon(polygon, ctx, ratio) {
	for (var ring = 0; ring < polygon.length; ring++) {
		var linearRing = polygon[ring];
		drawLine(linearRing, ctx, ratio);
	}
}

function styleFunction(feature, style) {
  if (!style) return null;
  if (style.styles) {
    var sorted = style.styles.sort(styleCompare);
    for (var i = 0; i < sorted.length; i++) {
      var styleProperty = sorted[i];
      var key = styleProperty.key;
      if (feature.properties && feature.properties[key]) {
        if (feature.properties[key] == styleProperty.value) {
          return {
            color: styleProperty.style['stroke'],
            fillOpacity: styleProperty.style['fill-opacity'],
            opacity: styleProperty.style['stroke-opacity'],
            weight: styleProperty.style['stroke-width'],
            fillColor: styleProperty.style['fill'],
						styleId: i
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
    fillColor: defaultStyle.style['fill'],
		styleId: style.styles.length
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

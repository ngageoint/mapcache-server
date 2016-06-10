var fs = require('fs-extra')
	, path = require('path')
	, turf = require('turf')
	, log = require('mapcache-log')
	, PureImage = require('pureimage')
	, Readable = require('stream').Readable
	, xyzTileUtils = require('xyz-tile-utils')
  , Through = require('through')
	, async = require('async')
	, config = require('mapcache-config')
	, mapcacheModels = require('mapcache-models')
	, FeatureModel = mapcacheModels.Feature;

exports.getFeatures = function(source, west, south, east, north, zoom, callback) {
	FeatureModel.findFeaturesWithin({sourceId: source.id}, west, south, east, north, 4326, callback);
};

function tileContainsData(source, bbox) {
	var bufferedBox = {
		west: Math.max(-180, bbox.west - Math.abs((bbox.east - bbox.west) * 0.02)),
		south: Math.max(-85, bbox.south - Math.abs((bbox.north - bbox.south) * 0.02)),
		east: Math.min(180, bbox.east + Math.abs((bbox.east - bbox.west) * 0.02)),
		north: Math.min(85, bbox.north + Math.abs((bbox.north - bbox.south) * 0.02))
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
	exports.getVectorTileWithLayer(source, null, format, z, x, y, params, callback);
};

exports.getVectorTileWithLayer = function(source, layer, format, z, x, y, params, callback) {
	log.debug('getting vector tile %d %d %d', z, x, y);
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
		log.debug('pulling tile from prebuilt', imageTile);
		return callback(null, fs.createReadStream(imageTile));
	} else {
		log.debug('getting tile from db', imageTile);
		if (source.source) {
			FeatureModel.fetchTileForCacheId(source.id, bbox, z, function(err, tile) {
				handleTileData(tile, format, source.source, imageTile, callback);
			});
		} else {
			if (layer) {
				FeatureModel.fetchTileForSourceIdAndLayerId(source.id, layer.id, bbox, z, format === 'geojson' ? '4326' : 'vector', function(err, tile) {
					console.log('err fetching tile? ', err);
					// console.log('tile is', tile);
					handleTileData(tile, format, source, imageTile, callback);
				});
			} else {
				FeatureModel.fetchTileForSourceId(source.id, bbox, z, format === 'geojson' ? '4326' : 'vector', function(err, tile) {
					console.log('err fetching tile? ', err);
					// console.log('tile is', tile);
					handleTileData(tile, format, source, imageTile, callback);
				});
			}
		}
	}
};

function handleTileData(tile, format, source, imageTile, callback) {
	try {
		if (format === 'png') {
			return exports.createImage(tile, source.style, callback);
		} else if (format === 'geojson') {
			var s = new Readable();
			var features = tile;
			log.info('there are %d features', features.length);
			for (var i = 0; i < features.length; i++) {
				var feature = features[i];
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
		console.log(e);
		throw e;
	}
}

exports.createImage = function(tile, style, callback) {
	var canvases = {};

	console.time('creating image');
	var ratio = 256 / 4096;
	var features = tile;
	log.info('creating image with %d features', features.length);

	var points = 0;
	var drawnFeatures = 0;

	async.eachSeries(features, function(geoJsonFeature, callback) {
		async.setImmediate(function () {
			var feature = JSON.parse(geoJsonFeature.geometry);
			var type = feature.type;
			var ctx;
			var styles = styleFunction(geoJsonFeature, style);
	    if (styles && !canvases[styles.styleId]) {
				var canvas = PureImage.make(256,256,{fillval: 0x00000000});
			  ctx = canvas.getContext('2d');
				canvases[styles.styleId] = {canvas: canvas, ctx: ctx};
        ctx.fillStyle = styles.fillColor;
	      ctx.lineWidth = styles.weight;
	      ctx.strokeStyle = styles.color;
	    } else {
				ctx = canvases[styles.styleId].ctx;
			}

	    ctx.beginPath();
      ctx.mode = 'REPLACE';

	    var geom = feature.coordinates;

			switch(type) {
				case 'Point':
					if (points < 10000) {
						points++;
						drawnFeatures++;
			      drawPoint(geom, ctx, ratio);
					}
					ctx.fill('evenodd');
					break;
				case 'MultiPoint':
					drawnFeatures++;
					for (var point = 0; point < geom.length; point++) {
						drawPoint(geom[point], ctx, ratio);
					}
					break;
				case 'LineString':
					drawnFeatures++;
					drawLine(geom, ctx, ratio);
					break;
				case 'MultiLineString':
					drawnFeatures++;
					for (var line = 0; line < geom.length; line++) {
						drawLine(geom[line], ctx, ratio);
					}
					break;
				case 'Polygon':
					drawnFeatures++;
					drawPolygon(geom, ctx, ratio);
					ctx.fill('evenodd');
					break;
				case 'MultiPolygon':
					drawnFeatures++;
					for (var poly = 0; poly < geom.length; poly++) {
						drawPolygon(geom[poly], ctx, ratio);
					}
					ctx.fill('evenodd');
					break;
			}
	    ctx.stroke();
			callback();
		});
	}, function() {
		var finalCanvas = PureImage.make(256,256,{fillval: 0x00000000});
		var finalCtx = finalCanvas.getContext('2d');
		async.forEachOfSeries(canvases, function(canvas, key, callback) {
      finalCtx.mode = 'REPLACE';
      finalCtx.drawImage(canvases[key].canvas, 0, 0);
      callback();
		}, function() {
			console.timeEnd('creating image');
			log.info('finished creating image with %d features', drawnFeatures);
      var ts = Through();
      PureImage.encodePNG(finalCanvas, ts, function(err) { });
      callback(null, ts);
		});
	});
};

function drawPoint(point, ctx, ratio) {
	ctx.arc(~~(point[0] * ratio), ~~(256-(point[1] * ratio)), 2, 0, 2 * Math.PI, false);
}

function drawLine(line, ctx, ratio) {
	var move = true;
	for (var k = 0; k < line.length; k++) {
		var coord = line[k];
		if (coord[0] === null || coord[1] === null) continue;

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
        if (feature.properties[key] === styleProperty.value) {
          return {
            color: styleProperty.style.stroke,
            fillOpacity: styleProperty.style['fill-opacity'],
            opacity: styleProperty.style['stroke-opacity'],
            weight: styleProperty.style['stroke-width'],
            fillColor: styleProperty.style.fill,
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
    color: defaultStyle.style.stroke,
    fillOpacity: defaultStyle.style['fill-opacity'],
    opacity: defaultStyle.style['stroke-opacity'],
    weight: defaultStyle.style['stroke-width'],
    fillColor: defaultStyle.style.fill,
		styleId: style.styles ? style.styles.length : 0
  };
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

var gdal = require("gdal")
  , util = require('util')
  , exec = require('child_process').exec
  , turf = require('turf')
  , path = require('path')
  , fs = require('fs-extra')
  , png = require('pngjs')
  , xyzTileUtils = require('xyz-tile-utils')
  , log = require('mapcache-log');

exports.processSource = function(source, callback, progressCallback) {
  callback = callback || function() {};
  progressCallback = progressCallback || function(source, callback) { callback(null, source);};
  source.status.message="Processing source";
  source.status.complete = false;
  progressCallback(source, function(err, newSource) {
    source = newSource;
    try {
      var stats = fs.statSync(source.file.path);
      log.info('stats', stats);
      if (!stats.isFile()) return callback(new Error('source file ' + source.file.path + ' does not exist'), source);
    } catch (e) {
      return callback(new Error('error reading source file ' + source.file.path), source);
    }
    log.info('Opening ' + source.file.path);
    var ds = gdal.open(source.file.path);
    console.log(exports.gdalInfo(ds));

    if (!ds.srs) {
      source.status.message="There is no Spatial Reference System in the file";
      source.status.complete = true;
      source.status.failure = true;
      return callback(null, source);
    }

    source.projection = ds.srs.getAuthorityCode("PROJCS");
    if (!source.projection) {
      source.projection = ds.srs.getAuthorityCode("GEOGCS");
    }
    var polygon = turf.polygon([sourceCorners(ds)]);
    source.geometry = polygon;
    expandColorsIfNecessary(ds, source, function(err, newSource) {
      source = newSource;
      progressCallback(source, function(err, newSource) {
        source = newSource;
        createLowerResolution(ds, source, function(err, newSource) {
          source = newSource;
          source.status.message = "Complete";
          source.status.complete = true;
          callback(null, source);
        });
      });
    });
  });
};

function expandColorsIfNecessary(ds, source, callback) {
  console.log('ds.bands.get(1).colorInterpretation', ds.bands.get(1).colorInterpretation);
  var fileName = path.basename(path.basename(source.file.path), path.extname(source.file.path)) + '_expanded.tif';
  var file = path.join(path.dirname(source.file.path), fileName);
  if (ds.bands.get(1).colorInterpretation === 'Palette' && !fs.existsSync(file)) {
    // node-gdal cannot currently return the palette so I need to translate it into a geotiff with bands
    exec(
      'gdal_translate -expand rgb ' + source.file.path + " " + file,
    function() {
      source.file.path = file;
      callback(null, source);
    });
  } else {
    callback(null, source);
  }
}

function createLowerResolution(ds, source, callback) {
  var fileName = path.basename(path.basename(source.file.path), path.extname(source.file.path)) + '_1024.tif';
  var file = path.join(path.dirname(source.file.path), fileName);
  log.info('Creating lower resolution image at %s', file);

  if (fs.existsSync(file)) {
    var gdalFile = gdal.open(file);

    source.scaledFiles = source.scaledFiles || [];
    source.scaledFiles.push({
      path: file,
      resolution: gdalFile.geoTransform[1]
    });
    return callback(null, source);
  }

  var width = 0;
  var height = 1024;

  if (ds.rasterSize.x < ds.rasterSize.y) {
    width = 1024;
    height = 0;
  }

  exec(
    'gdalwarp -ts '+ width+' ' + height +' -dstalpha -t_srs \'EPSG:3857\' -co COMPRESS=LZW -co TILED=YES ' + source.file.path + " " + file,
  function(error, stdout, stderr) {
    console.log('stderr', stderr);
    var gdalFile = gdal.open(file);

    source.scaledFiles = source.scaledFiles || [];
    source.scaledFiles.push({
      path: file,
      resolution: gdalFile.geoTransform[1]
    });
    callback(null, source);
  });
}

function createCutlineInProjection(envelope, srs) {
  var tx = new gdal.CoordinateTransformation(gdal.SpatialReference.fromEPSG(4326), srs);

  var ul = tx.transformPoint(envelope.west, envelope.north);
	var ur = tx.transformPoint(envelope.east, envelope.north);
	var lr = tx.transformPoint(envelope.east, envelope.south);
	var ll = tx.transformPoint(envelope.west, envelope.south);

	var cutline = new gdal.Polygon();
	var ring = new gdal.LinearRing();
	ring.points.add([ul,ur,lr,ll,ul]);
	cutline.rings.add(ring);
  return cutline;
}

function createPixelCoordinateCutline(envelope, ds) {
  var sourceCoords = new gdal.CoordinateTransformation(gdal.SpatialReference.fromEPSG(4326), ds.srs);

  var sourcePixels = new gdal.CoordinateTransformation(ds.srs, ds);

  var ul = sourceCoords.transformPoint(envelope.west, envelope.north);
	var ur = sourceCoords.transformPoint(envelope.east, envelope.north);
	var lr = sourceCoords.transformPoint(envelope.east, envelope.south);
	var ll = sourceCoords.transformPoint(envelope.west, envelope.south);

  ul = sourcePixels.transformPoint(ul.x, ul.y);
  ur = sourcePixels.transformPoint(ur.x, ur.y);
  lr = sourcePixels.transformPoint(lr.x, lr.y);
  ll = sourcePixels.transformPoint(ll.x, ll.y);

	var cutline = new gdal.Polygon();
	var ring = new gdal.LinearRing();
	ring.points.add([ul,ur,lr,ll,ul]);
	cutline.rings.add(ring);
  return cutline;
}

function pickCorrectResolutionFile(source, zoom) {
  var filePath = source.file.path;
  var zoomRes = xyzTileUtils.getZoomLevelResolution(zoom);
  var currentRes = 0;
  for (var scaleFileIndex = 0; source.scaledFiles && scaleFileIndex < source.scaledFiles.length; scaleFileIndex++) {
    log.info('Zoom res: %d scaledFile res: %d current Res: %d', zoomRes, source.scaledFiles[scaleFileIndex].resolution, currentRes);
    if (zoomRes > source.scaledFiles[scaleFileIndex].resolution && currentRes < source.scaledFiles[scaleFileIndex].resolution) {
      filePath = source.scaledFiles[scaleFileIndex].path;
    }
  }
  return filePath;
}

exports.getTile = function(source, format, z, x, y, params, callback) {
  format = format.toLowerCase();
  if (format !== 'png' && format !== 'jpeg') return callback(null, null);
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + source.name);

  var filePath = pickCorrectResolutionFile(source, z);
  console.log('using the source file', filePath);

  var tileEnvelope = xyzTileUtils.tileBboxCalculator(x, y, z);
  var tilePoly = turf.bboxPolygon([tileEnvelope.west, tileEnvelope.south, tileEnvelope.east, tileEnvelope.north]);
  var intersection = turf.intersect(tilePoly, source.geometry);
  if (!intersection){
    console.log("GeoTIFF does not intersect the requested tile");
    return callback();
  }

  var gdalFile = gdal.open(filePath);

  console.log('in_ds.bands.get(1).colorInterpretation', gdalFile.bands.get(1).colorInterpretation);
  var grayscale = gdalFile.bands.get(1).colorInterpretation === 'Gray';

  var gt = gdalFile.geoTransform;

  if (gt[2] !== 0 || gt[4] !== 0) {
    console.log("error the geotiff is skewed, need to warp first");
    return callback();
  }

  var fullExtent = turf.extent(source.geometry);

  var cutline = createCutlineInProjection(tileEnvelope, gdal.SpatialReference.fromEPSG(3857));
  var srcCutline = createPixelCoordinateCutline({west: fullExtent[0], south: fullExtent[1], east: fullExtent[2], north: fullExtent[3]}, gdalFile);

  var reprojectedFile = reproject(gdalFile, 3857, cutline, srcCutline);

  var readOptions = {};
  if (grayscale) {
    readOptions.pixel_space = 1; // jshint ignore:line
  }
  var pixelRegion1 = reprojectedFile.bands.get(1).pixels.read(0, 0, 256, 256, null, readOptions);
  var pixelRegion2 = reprojectedFile.bands.get(2).pixels.read(0, 0, 256, 256, null, readOptions);
  var pixelRegion3 = reprojectedFile.bands.get(3).pixels.read(0, 0, 256, 256, null, readOptions);
  var pixelRegion4 = reprojectedFile.bands.get(4).pixels.read(0, 0, 256, 256, null, readOptions);

  if (grayscale) {
    pixelRegion2 = pixelRegion3 = pixelRegion1;
  }

  if (!pixelRegion1) {
    return callback();
  }
  var options = {
    buffer_width: 256, // jshint ignore:line
    buffer_height: 256 // jshint ignore:line
  };

  var img = new png.PNG({
      width: options.buffer_width, // jshint ignore:line
      height: options.buffer_height, // jshint ignore:line
      filterType: 0
  });
  for (var i = 0; i < pixelRegion1.length; i++) {
    img.data[i*4] = pixelRegion1[i];
    img.data[(i*4)+1] = pixelRegion2[i];
    img.data[(i*4)+2] = pixelRegion3[i];
    img.data[(i*4)+3] = pixelRegion4[i];
  }

  console.log('got the image data');

  var stream = img.pack();
  callback(null, stream);

  reprojectedFile.close();
};

function reproject(ds, epsgCode, cutline, srcCutline) {
  var extent = cutline.getEnvelope();
  var targetSrs = gdal.SpatialReference.fromEPSG(epsgCode);

  var gt = ds.geoTransform;

  var tr = {x:Math.max(extent.maxX-extent.minX)/256, y: Math.max(extent.maxY-extent.minY)/256 };

  var destination = gdal.open('memory', 'w', "MEM", 256, 256, 4);

  destination.srs = targetSrs;
  destination.geoTransform = [
		extent.minX, tr.x, gt[2],
		extent.maxY, gt[4], -tr.y
	];

  gdal.reprojectImage({
    src: ds,
    dst: destination,
    s_srs: ds.srs, // jshint ignore:line
    t_srs: targetSrs, // jshint ignore:line
    cutline: srcCutline,
    dstAlphaBand: 4
  });
  ds.close();
  return destination;
}

function sourceCorners(ds) {
  var size = ds.rasterSize;
  var geotransform = ds.geoTransform;

  // corners
  var corners = {
  	'Upper Left  ' : {x: 0, y: 0},
  	'Upper Right ' : {x: size.x, y: 0},
  	'Bottom Right' : {x: size.x, y: size.y},
  	'Bottom Left ' : {x: 0, y: size.y}
  };

  var wgs84 = gdal.SpatialReference.fromEPSG(4326);
  var coordTransform = new gdal.CoordinateTransformation(ds.srs, wgs84);

  var cornerNames = Object.keys(corners);

  var coordinateCorners = [];

  cornerNames.forEach(function(cornerName) {
  	// convert pixel x,y to the coordinate system of the raster
  	// then transform it to WGS84
  	var corner      = corners[cornerName];
  	var ptOrig     = {
  		x: geotransform[0] + corner.x * geotransform[1] + corner.y * geotransform[2],
  		y: geotransform[3] + corner.x * geotransform[4] + corner.y * geotransform[5]
  	};
  	var ptWgs84    = coordTransform.transformPoint(ptOrig);
    coordinateCorners.push([ptWgs84.x, ptWgs84.y]);
  });

  coordinateCorners.push([coordinateCorners[0][0], coordinateCorners[0][1]]);
  return coordinateCorners;
}


exports.gdalInfo = function(ds) {
  console.log("number of bands: " + ds.bands.count());
  var size = ds.rasterSize;
  if (ds.rasterSize) {
    console.log("width: " + ds.rasterSize.x);
    console.log("height: " + ds.rasterSize.y);
  }
  var geotransform = ds.geoTransform;
  if (geotransform) {
    console.log('Origin = (' + geotransform[0] + ', ' + geotransform[3] + ')');
    console.log('Pixel Size = (' + geotransform[1] + ', ' + geotransform[5] + ')');
    console.log('GeoTransform =');
    console.log(geotransform);
  }

  var layer = ds.layers;
  console.log('DataSource Layer Count', layer.count());
  for (var i = 0; i < layer.count(); i++) {
    console.log('Layer %d:', i, layer.get(i));
  }


  console.log("srs: " + (ds.srs ? ds.srs.toPrettyWKT() : 'null'));
  if (!ds.srs) return;
  // corners
  var corners = {
  	'Upper Left  ' : {x: 0, y: 0},
  	'Upper Right ' : {x: size.x, y: 0},
  	'Bottom Right' : {x: size.x, y: size.y},
  	'Bottom Left ' : {x: 0, y: size.y}
  };

  var wgs84 = gdal.SpatialReference.fromEPSG(4326);
  var coordTransform = new gdal.CoordinateTransformation(ds.srs, wgs84);

  console.log("Corner Coordinates:");
  var cornerNames = Object.keys(corners);

  var coordinateCorners = [];

  cornerNames.forEach(function(cornerName) {
  	// convert pixel x,y to the coordinate system of the raster
  	// then transform it to WGS84
  	var corner      = corners[cornerName];
  	var ptOrig     = {
  		x: geotransform[0] + corner.x * geotransform[1] + corner.y * geotransform[2],
  		y: geotransform[3] + corner.x * geotransform[4] + corner.y * geotransform[5]
  	};
  	var ptWgs84    = coordTransform.transformPoint(ptOrig);
  	var description = util.format('%s (%d, %d) (%s, %s)',
  		cornerName,
  		Math.floor(ptOrig.x * 100) / 100,
  		Math.floor(ptOrig.y * 100) / 100,
  		gdal.decToDMS(ptWgs84.x, 'Long'),
  		gdal.decToDMS(ptWgs84.y, 'Lat')
  	);
    coordinateCorners.push([ptWgs84.x, ptWgs84.y]);
  	console.log(description);
  });
};

var gdal = require("gdal")
  , util = require('util')
  , exec = require('child_process').exec
  , turf = require('turf')
  , path = require('path')
  , fs = require('fs-extra')
  , png = require('pngjs')
  , xyzTileUtils = require('xyz-tile-utils')
  , async = require('async')
  , config = require('mapcache-config');

  exports.processSource = function(source, callback, progressCallback) {
    callback = callback || function() {};
    progressCallback = progressCallback || function(source, callback) { callback(null, source);};
    source.status.message="Processing source";
    source.status.complete = false;
    progressCallback(source, function(err, newSource) {
      source = newSource;
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
  }

function expandColorsIfNecessary(ds, source, callback) {
  console.log('ds.bands.get(1).colorInterpretation', ds.bands.get(1).colorInterpretation);
  if (ds.bands.get(1).colorInterpretation == 'Palette') {
    // node-gdal cannot currently return the palette so I need to translate it into a geotiff with bands
    var fileName = path.basename(path.basename(source.file.path), path.extname(source.file.path)) + '_expanded.tif';
    var file = path.join(path.dirname(source.file.path), fileName);
    var python = exec(
      'gdal_translate -expand rgb ' + source.file.path + " " + file,
    function(error, stdout, stderr) {
      source.file.path = file;
      callback(null, source);
    });
  } else {
    callback(null, source);
  }
}

function createLowerResolution(ds, source, callback) {

  if (ds.rasterSize.x < ds.rasterSize.y) {
    width = 1024;
    height = 0;
  } else {
    width = 0;
    height = 1024;
  }

  var fileName = path.basename(path.basename(source.file.path), path.extname(source.file.path)) + '_1024.tif';
  var file = path.join(path.dirname(source.file.path), fileName);
  var python = exec(
    'gdalwarp -ts '+ width+' ' + height +' -co COMPRESS=LZW -co TILED=YES ' + source.file.path + " " + file,
  function(error, stdout, stderr) {
    var in_ds = gdal.open(file);

    source.scaledFiles = source.scaledFiles || [];
    source.scaledFiles.push({
      path: file,
      resolution: in_ds.geoTransform[1]
    });
    callback(null, source);
    // SourceModel.updateDatasource(source, function(err, source) {
    //   callback(err, source);
    // });
  });
}

// direct port from gdal2tiles.py
function tileRasterBounds(ds, ulx, uly, lrx, lry) {

  console.log('ulx %d uly %d lrx %d lry %d', ulx, uly, lrx, lry);

  var gt = ds.geoTransform;
  var rx = Math.floor((ulx - gt[0]) / gt[1] + 0.001);
  var ry = Math.floor((uly - gt[3]) / gt[5] + 0.001);
  var rxsize = Math.floor((lrx - ulx) / gt[1] + 0.5);
  var rysize = Math.floor((lry - uly) / gt[5] + 0.5);

  var wxsize = rxsize;
  var wysize = rysize;

  console.log('rxsize %d rysize %d rx %d ry %d', rxsize, rysize, rx, ry);

  var wx = 0;
  if (rx < 0) {
    var rxshift = Math.abs(rx);
    wx = Math.floor(wxsize * (rxshift / rxsize));
    wxsize = wxsize - wx;
    rxsize = rxsize - Math.floor(rxsize * (rxshift / rxsize));
    rx = 0;
  }
  if ((rx + rxsize) > ds.rasterSize.x) {
    wxsize = Math.floor(wxsize * ((ds.rasterSize.x - rx) / rxsize));
    rxsize = ds.rasterSize.x - rx;
  }
  var wy = 0;
  if (ry < 0) {
    var ryshift = Math.abs(ry);
    wy = Math.floor(wysize * (ryshift / rysize));
    wysize = wysize - wy;
    rysize = rysize - Math.floor(rysize * (ryshift / rysize));
    ry = 0;
  }
  if ((ry + rysize) > ds.rasterSize.y) {
    wysize = Math.floor(wysize * ((ds.rasterSize.y - ry)/ rysize));
    rysize = ds.rasterSize.y - ry;
  }

  return {
    rx: rx,
    ry: ry,
    rxsize: rxsize,
    rysize: rysize,
    wx: wx,
    wy: wy,
    wxsize: wxsize,
    wysize: wysize
  };
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

  var cutlineCoords = createCutlineInProjection(envelope, ds.srs);

  var ul = sourceCoords.transformPoint(envelope.west, envelope.north);
	var ur = sourceCoords.transformPoint(envelope.east, envelope.north);
	var lr = sourceCoords.transformPoint(envelope.east, envelope.south);
	var ll = sourceCoords.transformPoint(envelope.west, envelope.south);

  var ul = sourcePixels.transformPoint(ul.x, ul.y);
  var ur = sourcePixels.transformPoint(ur.x, ur.y);
  var lr = sourcePixels.transformPoint(lr.x, lr.y);
  var ll = sourcePixels.transformPoint(ll.x, ll.y);

	var cutline = new gdal.Polygon();
	var ring = new gdal.LinearRing();
	ring.points.add([ul,ur,lr,ll,ul]);
	cutline.rings.add(ring);
  return cutline;
}

exports.getTile = function(source, format, z, x, y, params, callback) {
  format = format.toLowerCase();
  if (format != 'png' && format != 'jpeg') return callback(null, null);
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + source.name);

  var filePath = source.file.path;
  var zoomRes = xyzTileUtils.getZoomLevelResolution(z);
  var currentRes = 0;
  for (var i = 0; source.scaledFiles && i < source.scaledFiles.length; i++) {
    if (zoomRes > source.scaledFiles[i].resolution && currentRes < source.scaledFiles[i].resolution) {
      filePath = source.scaledFiles[i].path;
    }
  }

  console.log('using the source file', filePath);

  var tileEnvelope = xyzTileUtils.tileBboxCalculator(x, y, z);
  var tilePoly = turf.bboxPolygon([tileEnvelope.west, tileEnvelope.south, tileEnvelope.east, tileEnvelope.north]);
  var intersection = turf.intersect(tilePoly, source.geometry);
  if (!intersection){
    console.log("GeoTIFF does not intersect the requested tile");
    return callback();
  }

  var in_ds = gdal.open(filePath);
  // exports.gdalInfo(in_ds);

  var in_srs = in_ds.srs;
  console.log('in_ds.bands.get(1).colorInterpretation', in_ds.bands.get(1).colorInterpretation);
  var grayscale = in_ds.bands.get(1).colorInterpretation == 'Gray';

  var in_gt = in_ds.geoTransform;

  if (in_gt[2] != 0 || in_gt[4] != 0) {
    console.log("error the geotiff is skewed, need to warp first");
    return callback();
  }

  var w =  in_ds.rasterSize.x;
  var h =  in_ds.rasterSize.y;

  var fullExtent = turf.extent(source.geometry);

  var cutline = createCutlineInProjection(tileEnvelope, gdal.SpatialReference.fromEPSG(3857));
  var srcCutline = createPixelCoordinateCutline({west: fullExtent[0], south: fullExtent[1], east: fullExtent[2], north: fullExtent[3]}, in_ds);

  var extent = cutline.getEnvelope();

  var out_ds = reproject(in_ds, 3857, cutline, srcCutline);

  var readOptions = {};
  if (grayscale) {
    readOptions.pixel_space = 1;
  }
  var pixelRegion1 = out_ds.bands.get(1).pixels.read(0, 0, 256, 256, null, readOptions);
  var pixelRegion2 = out_ds.bands.get(2).pixels.read(0, 0, 256, 256, null, readOptions);
  var pixelRegion3 = out_ds.bands.get(3).pixels.read(0, 0, 256, 256, null, readOptions);
  var pixelRegion4 = out_ds.bands.get(4).pixels.read(0, 0, 256, 256, null, readOptions);

  if (grayscale) {
    pixelRegion2 = pixelRegion3 = pixelRegion1;
  }

  if (!pixelRegion1) {
    return callback();
  }
  var options = {
    buffer_width: 256,
    buffer_height: 256
  };

  var img = new png.PNG({
      width: options.buffer_width,
      height: options.buffer_height,
      filterType: 0
  });
  for (var i = 0; i < pixelRegion1.length; i++) {
    img.data[i*4] = pixelRegion1[i];
    img.data[(i*4)+1] = pixelRegion2[i];
    img.data[(i*4)+2] = pixelRegion3[i];
    img.data[(i*4)+3] = pixelRegion4[i];
  }

  var tileSize = 0;
  var stream = img.pack();
  stream.on('data', function(chunk) {
    tileSize += chunk.length;
  });
  stream.on('end', function() {
    // SourceModel.updateSourceAverageSize(source, tileSize, function(err) {
    // });
  });
  callback(null, stream);

  out_ds.close();
}

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
    s_srs: ds.srs,
    t_srs: targetSrs,
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
  var coord_transform = new gdal.CoordinateTransformation(ds.srs, wgs84);

  var corner_names = Object.keys(corners);

  var coordinateCorners = [];

  corner_names.forEach(function(corner_name) {
  	// convert pixel x,y to the coordinate system of the raster
  	// then transform it to WGS84
  	var corner      = corners[corner_name];
  	var pt_orig     = {
  		x: geotransform[0] + corner.x * geotransform[1] + corner.y * geotransform[2],
  		y: geotransform[3] + corner.x * geotransform[4] + corner.y * geotransform[5]
  	}
  	var pt_wgs84    = coord_transform.transformPoint(pt_orig);
    coordinateCorners.push([pt_wgs84.x, pt_wgs84.y]);
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
  var coord_transform = new gdal.CoordinateTransformation(ds.srs, wgs84);

  console.log("Corner Coordinates:")
  var corner_names = Object.keys(corners);

  var coordinateCorners = [];

  corner_names.forEach(function(corner_name) {
  	// convert pixel x,y to the coordinate system of the raster
  	// then transform it to WGS84
  	var corner      = corners[corner_name];
  	var pt_orig     = {
  		x: geotransform[0] + corner.x * geotransform[1] + corner.y * geotransform[2],
  		y: geotransform[3] + corner.x * geotransform[4] + corner.y * geotransform[5]
  	}
  	var pt_wgs84    = coord_transform.transformPoint(pt_orig);
  	var description = util.format('%s (%d, %d) (%s, %s)',
  		corner_name,
  		Math.floor(pt_orig.x * 100) / 100,
  		Math.floor(pt_orig.y * 100) / 100,
  		gdal.decToDMS(pt_wgs84.x, 'Long'),
  		gdal.decToDMS(pt_wgs84.y, 'Lat')
  	);
    coordinateCorners.push([pt_wgs84.x, pt_wgs84.y]);
  	console.log(description);
  });
}

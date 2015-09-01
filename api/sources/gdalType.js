var gdal = require("gdal")
  , util = require('util')
  , exec = require('child_process').exec
  , turf = require('turf')
  , path = require('path')
  , fs = require('fs-extra')
  , png = require('pngjs')
  , tu = require('../tileUtilities')
  , async = require('async')
  , SourceModel = require('../../models/source')
  , CacheModel = require('../../models/cache')
  , config = require('../../config.json');

  exports.processSource = function(source, callback) {
    source.status.message="Processing source";
    source.status.complete = false;
    source.save(function(err) {
      var ds = gdal.open(source.filePath);

      source.projection = ds.srs.getAuthorityCode("PROJCS");
      var polygon = turf.polygon([sourceCorners(ds)]);
      source.geometry = polygon;

      if (ds.bands.get(1).colorInterpretation == 'Palette') {
        ds.close();
        // node-gdal cannot currently return the palette so I need to translate it into a geotiff with bands
        var python = exec(
          'gdal_translate -expand rgb ' + source.filePath + " " + source.filePath + "_expanded.tif",
         function(error, stdout, stderr) {
           source.filePath = source.filePath + '_expanded.tif';
           source.status.message = "Complete";
           source.status.complete = true;
           source.save(function() {
             console.log('done running ' +   'gdal_translate -expand rgb ' + source.filePath + " " + source.filePath + "_expanded.tif");
             callback();
           });
         });
      } else {
        source.status.message = "Complete";
        source.status.complete = true;
        source.save(function(err) {
          ds.close();

          callback(err);
        });
      }
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

  console.log('ul', ul);
  console.log('ur', ur);
  console.log('lr', lr);
  console.log('ll', ll);

	var cutline = new gdal.Polygon();
	var ring = new gdal.LinearRing();
	ring.points.add([ul,ur,lr,ll,ul]);
	cutline.rings.add(ring);
  return cutline;
}

exports.getTile = function(source, format, z, x, y, params, callback) {
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + source.name);
  var tileEnvelope = tu.tileBboxCalculator(x, y, z);
  var tilePoly = turf.bboxPolygon([tileEnvelope.west, tileEnvelope.south, tileEnvelope.east, tileEnvelope.north]);
  var intersection = turf.intersect(tilePoly, source.geometry);
  if (!intersection){
    console.log("GeoTIFF does not intersect the requested tile");
    return callback();
  }

  var in_ds = gdal.open(source.filePath);
  exports.gdalInfo(in_ds);

  var in_srs = in_ds.srs;

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

  var pixelRegion1 = out_ds.bands.get(1).pixels.read(0, 0, 256, 256, null, options);
  var pixelRegion2 = out_ds.bands.get(2).pixels.read(0, 0, 256, 256, null, options);
  var pixelRegion3 = out_ds.bands.get(3).pixels.read(0, 0, 256, 256, null, options);
  var pixelRegion4 = out_ds.bands.get(4).pixels.read(0, 0, 256, 256, null, options);

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
    SourceModel.updateSourceAverageSize(source, tileSize, function(err) {
    });
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
  console.log("width: " + ds.rasterSize.x);
  console.log("height: " + ds.rasterSize.y);
  var geotransform = ds.geoTransform;
  console.log('Origin = (' + geotransform[0] + ', ' + geotransform[3] + ')');
  console.log('Pixel Size = (' + geotransform[1] + ', ' + geotransform[5] + ')');
  console.log('GeoTransform =');
  console.log(geotransform);
  console.log("srs: " + (ds.srs ? ds.srs.toPrettyWKT() : 'null'));

  console.log("Authority EPSG:" + ds.srs.getAuthorityCode("PROJCS"));

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

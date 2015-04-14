var gdal = require("gdal")
  , util = require('util')
  , turf = require('turf')
  , path = require('path')
  , fs = require('fs-extra')
  , png = require('pngjs')
  , config = require('../../config.json');

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

  function tileBboxCalculator(x, y, z) {
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

exports.process = function(source, callback) {
  console.log("geotiff");

  var ds = gdal.open(source.filePath);
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

  coordinateCorners.push([coordinateCorners[0][0], coordinateCorners[0][1]]);

  var polygon = turf.polygon([coordinateCorners]);
  source.geometry = polygon;
  source.save();

  ds.close();

  callback(null, source);
}

// direct port from gdal2tiles.py
function tileRasterBounds(ds, ulx, uly, lrx, lry) {

  var gt = ds.geoTransform;
  var rx = Math.floor((ulx - gt[0]) / gt[1] + 0.001);
  var ry = Math.floor((uly - gt[3]) / gt[5] + 0.001);
  var rxsize = Math.floor((lrx - ulx) / gt[1] + 0.5);
  var rysize = Math.floor((lry - uly) / gt[5] + 0.5);

  var wxsize = rxsize;
  var wysize = rysize;

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

exports.getTile = function(source, z, x, y, callback) {
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + source.name);

  var tileEnvelope = tileBboxCalculator(x, y, z);
  var tilePoly = turf.bboxPolygon([tileEnvelope.west, tileEnvelope.south, tileEnvelope.east, tileEnvelope.north]);
  var intersection = turf.intersect(tilePoly, source.geometry);
  if (!intersection){
    console.log("GeoTIFF does not intersect the requested tile");
    callback();
    return;
  }

  var ds = gdal.open(source.filePath);

  // we are assuming that the output SRS is the same as the input SRS.  This will
  // normally not be the case so we will have to reproject at some point

  var out_srs = gdal.SpatialReference.fromEPSG(3857);
  var out_ds = ds;

  var out_gt = out_ds.geoTransform;

  if (out_gt[2] != 0 || out_gt[4] != 0) {
    console.log("error the geotiff is skewed, need to warp first");
    callback();
  }

  // output bounds - coordinates in the output SRS
  var ominx = out_gt[0];
  var omaxx = out_gt[0] + out_ds.rasterSize.x * out_gt[1];
  var omaxy = out_gt[3];
  var ominy = out_gt[3] - out_ds.rasterSize.y * out_gt[1];

  console.log("Bounds (output srs): " + ominx + ", " + ominy + ", " + omaxx + ", " + omaxy);

  var coord_transform = new gdal.CoordinateTransformation(gdal.SpatialReference.fromEPSG(4326), out_srs);
  var ul = coord_transform.transformPoint(tileEnvelope.west, tileEnvelope.north);
  var lr = coord_transform.transformPoint(tileEnvelope.east, tileEnvelope.south);
  var tminx = ul.x;
  var tmaxx = lr.x;
  var tminy = lr.y;
  var tmaxy = ul.y;

  // these represent the bounds of the tile in the output SRS.  They could be bigger or smaller than the actual image
  console.log("Tile Bounds (output srs): " + tminx + ", " + tminy + ", " + tmaxx + ", " + tmaxy);

  var ctminx = tminx;
  var ctmaxx = tmaxx;
  var ctminy = tminy;
  var ctmaxy = tmaxy;
  if (tminx < ominx) ctminx = ominx;
  if (tmaxx > omaxx) ctmaxx = omaxx;
  if (tminy < ominy) ctminy = ominy;
  if (tmaxy > omaxy) ctmaxy = omaxy;

  console.log("Corrected Tile Bounds (output srs): " + ctminx + ", " + ctminy + ", " + ctmaxx + ", " + ctmaxy);

  var tb = tileRasterBounds(out_ds, tminx, tmaxy, tmaxx, tminy);

  console.log("Tile Raster Bounds", tb);


  var options = {
    buffer_width: tb.wxsize,
    buffer_height: tb.wysize
  };

  var options = {
    buffer_width: Math.floor(256*Math.min(1,(ctmaxx-ctminx)/(tmaxx-tminx))),
    buffer_height: Math.floor(256*Math.min(1,(ctmaxy-ctminy)/(tmaxy-tminy)))
  };

  console.log('width %', (tmaxx-tminx)/(omaxx-ominx));
  console.log('height %', (tmaxy-tminy)/(omaxy-ominy));

  console.log('tile width', (tmaxx-tminx));
  console.log('tile height', (tmaxy-tminy));

  console.log('output width', (omaxx-ominx));
  console.log('output height', (omaxy-ominy));

  var pixelRegion1 = out_ds.bands.get(1).pixels.read(tb.rx, tb.ry, tb.rxsize, tb.rysize, null, options);
  var pixelRegion2 = out_ds.bands.get(2).pixels.read(tb.rx, tb.ry, tb.rxsize, tb.rysize, null, options);
  var pixelRegion3 = out_ds.bands.get(3).pixels.read(tb.rx, tb.ry, tb.rxsize, tb.rysize, null, options);

  var img = new png.PNG({
      width: options.buffer_width,
      height: options.buffer_height,
      filterType: 0
  });
  for (var i = 0; i < pixelRegion1.length; i++) {
    img.data[i*4] = pixelRegion1[i];
    img.data[(i*4)+1] = pixelRegion2[i];
    img.data[(i*4)+2] = pixelRegion3[i];
    img.data[(i*4)+3] = 255;
  }


  var finalImg = new png.PNG({
    width: 256,
    height: 256,
    filterType: 0
  });

  for (var i = 0; i < 256 * 256 * 4; i++) {
    finalImg.data[i] = 200;
  }

  var finalDestination = {
    x: Math.floor(256*(ctminx - tminx)/(tmaxx-tminx)),
    y: Math.floor(256*(ctmaxy - tmaxy)/(tmaxy-tminy))
  };

  console.log('final destination', finalDestination);

  img.bitblt(finalImg, 0, 0, options.buffer_width, options.buffer_height, finalDestination.x, finalDestination.y);
  callback(null, finalImg.pack());

  out_ds.close();
}

function gdalInfo(ds) {
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

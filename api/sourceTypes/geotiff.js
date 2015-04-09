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
    console.log('tile to lon x ' + x);
    return (x/Math.pow(2,z)*360-180);
  }
  function tile2lat(y,z) {
    console.log('tile to lat y ' + y);
    // y = Math.pow(2,z) - y -1;
    var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
    return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
  }

  function tileBboxCalculator(x, y, z) {
    console.log('tile box calculator for ' + x + ' ' + y + ' ' + z);
    x = Number(x);
    y = Number(y);
    var tileBounds = {
      ul: {
        lat: tile2lat(y, z),
        lon: tile2lon(x, z)
      },
      lr: {
        lat: tile2lat(y+1, z),
        lon: tile2lon(x+1, z)
      }
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
  console.log('created a polygon', polygon);

  source.geometry = polygon;
  source.save();

  ds.close();

  callback(null, source);
}

exports.getTile = function(source, z, x, y, callback) {
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + source.name);
  var ds = gdal.open(source.filePath);

  var tileDirectory = path.join(config.server.sourceDirectory.path, source.id, z, x);
  fs.mkdirsSync(tileDirectory);
  var tileFilename = path.join(tileDirectory, y + '.png');
  var size = ds.rasterSize;
  var geotransform = ds.geoTransform;

  // corners
var corners = {
  'Upper Left  ' : {x: 0, y: 0},
  'Upper Right ' : {x: size.x, y: 0},
  'Bottom Right' : {x: size.x, y: size.y},
  'Bottom Left ' : {x: 0, y: size.y}
};

var wgs84 = gdal.SpatialReference.fromEPSG(3857);
var coord_transform = new gdal.CoordinateTransformation(ds.srs, wgs84);

console.log("Corner Coordinates:")
var corner_names = Object.keys(corners);

var xsize = ds.geoTransform[1];
var ysize = Math.abs(ds.geoTransform[5]);

var tileBbox = tileBboxCalculator(x, y, z);

var geotiffUpperLeft = {
  lat: ds.geoTransform[3],
  lon: ds.geoTransform[0]
};

var shift = {
  x: (tileBbox.ul.lon - geotiffUpperLeft.lon),
  y: (geotiffUpperLeft.lat - tileBbox.ul.lat)
};

var origin = {
  x: shift.x / xsize,
  y: shift.y / ysize
};

var lowerRight = {
  x: origin.x + ((tileBbox.lr.lon - tileBbox.ul.lon) / xsize),
  y: origin.y + ((tileBbox.ul.lat - tileBbox.lr.lat) / ysize)
};

console.log('geotiff', geotiffUpperLeft);
console.log("tile bbox", tileBbox);
console.log('origin', origin);
console.log('shift', shift);
console.log('lowerRight', lowerRight);

var xSizeRequest = Math.min(lowerRight.x, size.x) - origin.x;
var ySizeRequest = Math.min(lowerRight.y, size.y) - origin.y;

var lostPixelsX = lowerRight.x - size.x;
var lostPixelsY = lowerRight.y - size.y;

var xRatio = xSizeRequest/(lowerRight.x - origin.x);
var yRatio = ySizeRequest/(lowerRight.y - origin.y);

console.log('x size request ', xSizeRequest);
console.log('y size request ', ySizeRequest);

console.log('original width ', lowerRight.x - origin.x);
console.log('oroginal height ', lowerRight.y - origin.y)

console.log('lost pixels x', xRatio);
console.log('lost pixels y', yRatio);

var realOrigin = {
  x: origin.x,
  y: origin.y
}

var options = {};
options.buffer_width = Math.floor(256 * xRatio);
options.buffer_height = Math.floor(256 * yRatio);
var finalDestination = {
  x:0,
  y:0
};

if (origin.x < 0) {
  realOrigin.x = 0;
  xRatio = (xSizeRequest + origin.x) /xSizeRequest;
  xSizeRequest = xSizeRequest + origin.x;
  options.buffer_width = Math.floor(256 * xRatio);
  finalDestination.x = 256 - options.buffer_width;
}
if (origin.y < 0) {
  realOrigin.y = 0;
  yRatio = (ySizeRequest + origin.y) /ySizeRequest;
  ySizeRequest = ySizeRequest + origin.y;
  options.buffer_height = Math.floor(256 * yRatio);
  finalDestination.y = 256 - options.buffer_height;
}

console.log('options', options);

var pixelRegion1 = ds.bands.get(1).pixels.read(realOrigin.x, realOrigin.y, xSizeRequest, ySizeRequest, null, options);
var pixelRegion2 = ds.bands.get(2).pixels.read(realOrigin.x, realOrigin.y, xSizeRequest, ySizeRequest, null, options);
var pixelRegion3 = ds.bands.get(3).pixels.read(realOrigin.x, realOrigin.y, xSizeRequest, ySizeRequest, null, options);

if (options.buffer_width < 0 || options.buffer_height < 0) {
  ds.close();
  return callback();
}

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
  finalImg.data[i] = 0;
}

console.log('dst.w ' + finalImg.width + " dst.h " + finalImg.height + " options ", options);
img.bitblt(finalImg, 0, 0, options.buffer_width, options.buffer_height, finalDestination.x, finalDestination.y);

finalImg.pack().pipe(fs.createWriteStream(tileFilename)).on('finish', function(err) {
  callback(err, tileFilename);
});


ds.close();

}

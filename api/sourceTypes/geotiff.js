var gdal = require("gdal");
var util = require('util');
var turf = require('turf');

exports.process = function(source, callback) {
  console.log("geotiff");

  var dataset = gdal.open(source.filePath);
var ds = dataset;
  console.log("number of bands: " + dataset.bands.count());
  var size = dataset.rasterSize;
  console.log("width: " + dataset.rasterSize.x);
  console.log("height: " + dataset.rasterSize.y);
  var geotransform = dataset.geoTransform;
  console.log('Origin = (' + geotransform[0] + ', ' + geotransform[3] + ')');
console.log('Pixel Size = (' + geotransform[1] + ', ' + geotransform[5] + ')');
console.log('GeoTransform =');
console.log(geotransform);
  console.log("srs: " + (dataset.srs ? dataset.srs.toPrettyWKT() : 'null'));

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

  dataset.close();

  callback(null, source);
}

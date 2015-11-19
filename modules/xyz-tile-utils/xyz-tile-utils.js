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

var zoomLevelResolutions = [156412,78206,39103,19551,9776,4888,2444,1222,610.984,305.492,152.746,76.373,38.187,19.093,9.547,4.773,2.387,1.193,0.596,0.298];

exports.getZoomLevelResolution = function(z) {
	return zoomLevelResolutions[z];
}

exports.getXYZFullyEncompassingExtent = function(extent, minZoom, maxZoom) {
	var zoom = maxZoom || 18;
	var min = minZoom || 0;
	//find the first zoom level with 1 tile
	var y = exports.yCalculator(extent, zoom);
	var x = exports.xCalculator(extent, zoom);
	var found = false;
	for (zoom; zoom >= min && !found; zoom--) {
		y = exports.yCalculator(extent, zoom);
		x = exports.xCalculator(extent, zoom);
		if (y.min == y.max && x.min == x.max) {
			found = true;
		}
	}
	zoom = zoom+1;
	return {
		z: zoom,
		x: x.min,
		y: y.min
	};
}

exports.tileBboxCalculator = function(x, y, z) {
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
	x.min = Math.max(0,Math.min(x1, x2));
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
	y.min = Math.max(0,Math.min(y1, y2));
	y.current = Math.min(y1, y2);
	return y;
}

exports.getX = function(lon, zoom) {
	if (zoom == 0) return 0;
	var xtile = Math.floor((lon + 180) / 360 * (1 << zoom));
	return xtile;
}

exports.getY = function(lat, zoom) {
	if (zoom == 0) return 0;
	var ytile = Math.floor((1 - Math.log(Math.tan(Math.radians(parseFloat(lat))) + 1 / Math.cos(Math.radians(parseFloat(lat)))) / Math.PI) /2 * (1 << zoom));
	return ytile;
}

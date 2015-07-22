Math.radians = function(degrees) {
  return degrees * Math.PI / 180;
};

// Converts from radians to degrees.
Math.degrees = function(radians) {
  return radians * 180 / Math.PI;
};

angular
  .module('mapcache')
  .factory('TileUtilities', TileUtilities);

function TileUtilities() {

  return {
    getOverviewTilePath: getOverviewTilePath
  };
  
  function getX(lon, zoom) {
    var xtile = Math.floor((lon + 180) / 360 * (1 << zoom));
    return xtile;
  }

  function getY(lat, zoom) {
    var ytile = Math.floor((1 - Math.log(Math.tan(Math.radians(parseFloat(lat))) + 1 / Math.cos(Math.radians(parseFloat(lat)))) / Math.PI) /2 * (1 << zoom));
    return ytile;
  }

  function xCalculator(bbox,z) {
    var x = [];
    var x1 = getX(Number(bbox[0]), z);
    var x2 = getX(Number(bbox[2]), z);
    x.max = Math.max(x1, x2);
    x.min = Math.min(x1, x2);
    if (z == 0){
      x.current = Math.min(x1, x2);
    }
    return x;
  }

  function yCalculator(bbox,z) {
    var y = [];
    var y1 = getY(Number(bbox[1]), z);
    var y2 = getY(Number(bbox[3]), z);
    y.max = Math.max(y1, y2);
    y.min = Math.min(y1, y2);
    y.current = Math.min(y1, y2);
    return y;
  }

  function getOverviewTilePath(cache) {
    var extent = turf.extent(cache.geometry);
    if (!cache.maxZoom) {
      cache.maxZoom = 18;
    }
    if (!cache.minZoom) {
      cache.minZoom = 0;
    }
    //find the first zoom level with 1 tile
    var y = yCalculator(extent, cache.maxZoom);
    var x = xCalculator(extent, cache.maxZoom);
    var zoom = cache.maxZoom;
    var found = false;
    for (zoom; zoom >= cache.minZoom && !found; zoom--) {
      y = yCalculator(extent, zoom);
      x = xCalculator(extent, zoom);
      if (y.min == y.max && x.min == x.max) {
        found = true;
      }
    }
    zoom = zoom+1;
    return zoom+'/'+x.min+'/'+y.min+'.png';
  }
}

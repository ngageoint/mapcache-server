angular
  .module('mapcache')
  .controller('MapcacheCacheController', MapcacheCacheController);

MapcacheCacheController.$inject = [
  '$scope',
  '$location',
  '$timeout',
  '$routeParams',
  '$rootScope',
  'CacheService',
  'LocalStorageService'
];

function MapcacheCacheController($scope, $location, $timeout, $routeParams, $rootScope, CacheService, LocalStorageService) {

  $scope.token = LocalStorageService.getToken();

  $scope.mapOptions = {
    baseLayerUrl: 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png',
    opacity: .25
  };

  $scope.createAnotherCache = function() {
    $location.path('/create');
  }

  $scope.returnToList = function () {
    $location.path('/mapcache');
  };

  $scope.generateFormat = function(cache, format) {
    CacheService.createCacheFormat(cache, format, function() {
      cache.formats = cache.formats || {};
      cache.formats[format] = cache.formats[format] || {};
      cache.formats[format].generating = true;
      console.log('go get the cache');
      getCache(cache.id);
    });
  }

  $scope.cacheBoundingBox = function(cache) {
    if (!cache) return;
    var extent = turf.extent(cache.geometry);
    return "West: " + extent[0] + " South: " + extent[1] + " East: " + extent[2]+ " North: " + extent[3];
  }

  function getCache(id) {
    $scope.hasVectorSources = false;
    console.log('location.path', $location.path());
    var cache = $scope.cache || {};
    if (id) {
      cache.id = id;
    }
    CacheService.getCache(cache, function(cache) {
      // success
      $scope.cache = cache;
      for (var i = 0; i < cache.source.cacheTypes.length; i++) {
        if (cache.source.cacheTypes[i].vector) {
          $scope.hasVectorSources = true;
        }
      }
      $rootScope.title = $scope.cache.name;

      $scope.formatGenerating = _.some($scope.cache.formats, function(format) {
        console.log('format', format);
        return !format.complete;
      });

      console.log('format generating', formatGenerating);
      if ($scope.formatGenerating && $location.path().indexOf('/cache') == 0) {
        $timeout(getCache, 5000);
      }
    }, function(data) {
      // error
    });
  }

  getCache($routeParams.cacheId);

  $scope.createTiles = function(cache, minZoom, maxZoom) {
    cache.minZoom = minZoom;
    cache.maxZoom = maxZoom;
    CacheService.createCacheFormat(cache, 'xyz', function() {
      cache.formats = cache.formats || {};
      cache.formats['xyz'] = cache.formats['xyz'] || {};
      cache.formats['xyz'].generating = true;
      getCache(cache.id);
    });
  }

  $scope.calculateCacheSize = function(cache, minZoom, maxZoom) {
    if (!cache.source || ((isNaN(minZoom) || isNaN(maxZoom))) || !cache.geometry) return;
    cache.totalCacheSize = 0;
    cache.totalCacheTiles = 0;
    var extent = turf.extent(cache.geometry);
    for (var i = minZoom; i <= maxZoom; i++) {
      var xtiles = xCalculator(extent, i);
      var ytiles = yCalculator(extent, i);
      cache.totalCacheTiles += (1 + (ytiles.max - ytiles.min)) * (1 + (xtiles.max - xtiles.min));
    }
    cache.totalCacheSize = cache.totalCacheTiles * (cache.source.tileSize/cache.source.tileSizeCount);
  }

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

  function getX(lon, zoom) {
    var xtile = Math.floor((lon + 180) / 360 * (1 << zoom));
    return xtile;
  }

  function getY(lat, zoom) {
    var ytile = Math.floor((1 - Math.log(Math.tan(Math.radians(parseFloat(lat))) + 1 / Math.cos(Math.radians(parseFloat(lat)))) / Math.PI) /2 * (1 << zoom));
    return ytile;
  }

};

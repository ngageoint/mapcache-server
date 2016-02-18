var turf = require('turf');
var _ = require('underscore');

module.exports = function MapcacheCacheController($scope, $location, $timeout, $routeParams, $rootScope, CacheService, LocalStorageService) {

  $scope.token = LocalStorageService.getToken();

  $scope.mapOptions = {
    baseLayerUrl: 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png',
    opacity: 0.25
  };

  $scope.createAnotherCache = function() {
    $location.path('/create');
  };

  $scope.returnToList = function () {
    $location.path('/mapcache');
  };

  $scope.generateFormat = function(format) {
    CacheService.createCacheFormat($scope.cache, format, function() {
      $scope.cache.formats = $scope.cache.formats || {};
      $scope.cache.formats[format] = $scope.cache.formats[format] || {};
      $scope.cache.formats[format].generating = true;
      getCache($scope.cache.id);
    });
  };

  function getCache(id) {
    $scope.hasVectorSources = false;
    var cache = $scope.cache || {};
    if (id) {
      cache.id = id;
    }
    CacheService.getCache(cache, function(cache) {
      // success
      $scope.cache = cache;
      for (var i = 0; i < cache.source.dataSources.length; i++) {
        if (cache.source.dataSources[i].vector) {
          $scope.hasVectorSources = true;
        }
      }
      $rootScope.title = $scope.cache.name;

      $scope.formatGenerating = _.some($scope.cache.formats, function(format) {
        return !format.complete;
      });

      if ($scope.formatGenerating) {
        $timeout(getCache, 5000);
      }
    }, function() {
      // error
    });
  }

  getCache($routeParams.cacheId);

  $scope.createTiles = function(minZoom, maxZoom) {
    $scope.cache.minZoom = minZoom;
    $scope.cache.maxZoom = maxZoom;
    CacheService.createCacheFormat($scope.cache, 'xyz', function() {
      $scope.cache.formats = $scope.cache.formats || {};
      $scope.cache.formats.xyz = $scope.cache.formats.xyz || {};
      $scope.cache.formats.xyz.generating = true;
      getCache($scope.cache.id);
    });
  };

  $scope.calculateCacheSize = function(minZoom, maxZoom) {
    if (!$scope.cache.source || ((isNaN(minZoom) || isNaN(maxZoom))) || !$scope.cache.geometry) return;
    $scope.cache.totalCacheSize = 0;
    $scope.cache.totalCacheTiles = 0;
    var extent = turf.extent($scope.cache.geometry);
    for (var i = minZoom; i <= maxZoom; i++) {
      var xtiles = xCalculator(extent, i);
      var ytiles = yCalculator(extent, i);
      $scope.cache.totalCacheTiles += (1 + (ytiles.max - ytiles.min)) * (1 + (xtiles.max - xtiles.min));
    }
    $scope.cache.totalCacheSize = $scope.cache.totalCacheTiles * ($scope.cache.source.tileSize/$scope.cache.source.tileSizeCount);
  };

  Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
  };

  function xCalculator(bbox,z) {
    var x = [];
    var x1 = getX(Number(bbox[0]), z);
    var x2 = getX(Number(bbox[2]), z);
    x.max = Math.max(x1, x2);
    x.min = Math.min(x1, x2);
    if (z === 0){
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

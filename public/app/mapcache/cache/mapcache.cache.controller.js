var turf = require('turf');
var _ = require('underscore');
var xyzTileUtils = require('xyz-tile-utils');

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
    var extent = turf.extent($scope.cache.geometry);
    $scope.cache.totalCacheTiles = xyzTileUtils.tileCountInExtent(extent, minZoom, maxZoom);
    $scope.cache.totalCacheSize = $scope.cache.totalCacheTiles * ($scope.cache.source.tileSize/$scope.cache.source.tileSizeCount);
  };
};

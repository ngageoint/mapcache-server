var turf = require('turf');
var xyzTileUtils = require('xyz-tile-utils');
var config = require('../../config');
module.exports = function CacheListingController($scope, $rootScope, $timeout, LocalStorageService, CacheService) {

  $scope.token = LocalStorageService.getToken();
  $scope.options.opacity = $scope.options.opacity || 0.14;
  $scope.options.baseLayerUrl = $scope.options.baseLayerUrl || config.defaultMapLayer;

  var cacheHighlightPromise;
  $scope.showingCache = undefined;

  $scope.mouseClick = function(cache) {
    if (cacheHighlightPromise) {
      $timeout.cancel(cacheHighlightPromise);
    }

    if ($scope.showingCache) {
      $rootScope.$broadcast('hideCache', $scope.showingCache);
    }

    if (!$scope.showingCache || $scope.showingCache.id !== cache.id) {
      $scope.showingCache = cache;
      cacheHighlightPromise = $timeout(function() {
        $rootScope.$broadcast('showCache', cache);
      }, 500);
    } else {
      $scope.showingCache = undefined;
    }
  };

  $scope.mouseOver = function(cache) {
    if(!$scope.showingCache || $scope.showingCache.id !== cache.id) {
      $rootScope.$broadcast('showCacheExtent', cache);
    }
  };

  $scope.mouseOut = function(cache) {
    if(!$scope.showingCache || $scope.showingCache.id !== cache.id) {
      $rootScope.$broadcast('hideCacheExtent', cache);
    }
  };

  $rootScope.$on('cacheFootprintPopupOpen', function(event, cache) {
    $scope.mapFilter = cache.id;
  });

  $rootScope.$on('cacheFootprintPopupClose', function() {
    $scope.mapFilter = null;
  });

  $scope.$watch('cacheFilter+mapFilter', function() {
    $scope.$emit('cacheFilterChange', {cacheFilter: $scope.cacheFilter, mapFilter: $scope.mapFilter});
  });

  $scope.featureProperties = [];

  $scope.$watch('map.previewLayer', function(layer) {
    if (layer) {
      if (layer.EX_GeographicBoundingBox) { // jshint ignore:line
        $scope.mapOptions.extent = layer.EX_GeographicBoundingBox; // jshint ignore:line
      }
    }
  });

  $scope.generateFormat = function(cache, format) {
    $scope.$emit('generateFormat', cache, format);
  };

  $scope.createTiles = function(cache, minZoom, maxZoom) {
    cache.minZoom = minZoom;
    cache.maxZoom = maxZoom;
    CacheService.createCacheFormat(cache, 'xyz', function() {
      cache.formats = cache.formats || {};
      cache.formats.xyz = cache.formats.xyz || {};
      cache.formats.xyz.generating = true;
    });
    $scope.$emit('refreshCaches');
  };

  $scope.calculateCacheSize = function(cache, minZoom, maxZoom) {
    if (!cache.source || ((isNaN(minZoom) || isNaN(maxZoom))) || !cache.geometry) return;

    var extent = turf.bbox(cache.geometry);
    cache.totalCacheTiles = xyzTileUtils.tileCountInExtent(extent, minZoom, maxZoom);
    cache.totalCacheSize = cache.totalCacheTiles * (cache.source.tileSize/cache.source.tileSizeCount);
  };

};

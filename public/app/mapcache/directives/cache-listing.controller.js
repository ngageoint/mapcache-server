var turf = require('turf');
var xyzTileUtils = require('xyz-tile-utils');
module.exports = function CacheListingController($scope, $rootScope, $timeout, LocalStorageService, CacheService) {

  $scope.token = LocalStorageService.getToken();
  $scope.options.opacity = $scope.options.opacity || 0.14;
  $scope.options.baseLayerUrl = $scope.options.baseLayerUrl || 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png';

  var cacheHighlightPromise;
  $scope.mouseOver = function(cache) {
    $rootScope.$broadcast('showCacheExtent', cache);
    if (cacheHighlightPromise) {
      $timeout.cancel(cacheHighlightPromise);
    }
    cacheHighlightPromise = $timeout(function() {
      $rootScope.$broadcast('showCache', cache);
    }, 500);
  };

  $scope.mouseOut = function(cache) {
    $rootScope.$broadcast('hideCacheExtent', cache);

    if (cacheHighlightPromise) {
      $timeout.cancel(cacheHighlightPromise);
      cacheHighlightPromise = undefined;
    }
    $rootScope.$broadcast('hideCache', cache);
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

    var extent = turf.extent(cache.geometry);
    cache.totalCacheTiles = xyzTileUtils.tileCountInExtent(extent, minZoom, maxZoom);
    cache.totalCacheSize = cache.totalCacheTiles * (cache.source.tileSize/cache.source.tileSizeCount);
  };

};

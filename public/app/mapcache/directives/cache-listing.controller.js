var turf = require('turf');
var xyzTileUtils = require('xyz-tile-utils');
var config = require('../../config');
var mapcacheConfig = require('mapcache-config');
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

};

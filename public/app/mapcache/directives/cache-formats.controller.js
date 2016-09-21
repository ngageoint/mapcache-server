var turf = require('turf');
var xyzTileUtils = require('xyz-tile-utils');
var config = require('../../config');
var mapcacheConfig = require('mapcache-config');
module.exports = function CacheFormatsController($scope, $rootScope, $timeout, LocalStorageService, CacheService) {
  $scope.token = LocalStorageService.getToken();

  $scope.$watch('cache', function() {
    for (var i = 0; i < mapcacheConfig.sourceCacheTypes.raster.length; i++) {
      var type = mapcacheConfig.sourceCacheTypes.raster[i];
      if ($scope.cache.formats && $scope.cache.formats[type.type]) {
        $scope.cache.rasterCacheExists = true;
        $scope.cache.rasterTiles = $scope.cache.formats[type.type].generatedTiles;
      }
    }
    for (var i = 0; i < $scope.cache.source.dataSources.length; i++) {
      if ($scope.cache.source.dataSources[i].vector) {
        $scope.cache.hasVectorSources = true;
      }
    }
  });

  $scope.generateFormat = function(format) {
    CacheService.createCacheFormat($scope.cache, format, function() {
      $scope.cache.formats = $scope.cache.formats || {};
      $scope.cache.formats[format] = $scope.cache.formats[format] || {};
      $scope.cache.formats[format].generating = true;
      $scope.$emit('refreshCaches');
    });

  };

};

angular
  .module('mapcache')
  .controller('StorageController', StorageController);

StorageController.$inject = ['$scope', 'CacheService', 'SourceService', 'FormatService'];

function StorageController($scope, CacheService, SourceService, FormatService) {

  $scope.storage = {
    total: 8192 * 1024 * 1024,
    used: 1000 * 1024 * 1024,
    serverTotal: 10240 * 1024 * 1024,
    serverFree: 8500 * 1024 * 1024
  };

  $scope.formatName = function(name) {
    return FormatService[name];
  }

  CacheService.getAllCaches(true).success(function(caches) {
    for (var i = 0; i < caches.length; i++) {
      var size = cacheSize(caches[i]);
      caches[i].totalSize = size.total;
      caches[i].tileSize = size.tileBytes;
    }
    $scope.caches = caches;
  });

  function cacheSize(cache) {
    var bytes = 0;
    var tileBytes = 0;
    for (var zoomLevel in cache.status.zoomLevelStatus) {
      if (cache.status.zoomLevelStatus[zoomLevel].size) {
        bytes += cache.status.zoomLevelStatus[zoomLevel].size;
      }
    }
    tileBytes = bytes;
    for (var format in cache.formats) {
      if (cache.formats.hasOwnProperty(format)) {
        bytes += cache.formats[format].size;
      }
    }
    return {total: bytes, tileBytes: tileBytes};
  }

  SourceService.getAllSources(true).success(function(sources) {
    $scope.sources = sources;
    // if ($routeParams.sourceId) {
    //   for (var i = 0; i < $scope.sources.length && $scope.cache.source == null; i++) {
    //     if ($routeParams.sourceId == $scope.sources[i].id) {
    //       $scope.cache.source = $scope.sources[i];
    //     }
    //   }
    // }
  });

}

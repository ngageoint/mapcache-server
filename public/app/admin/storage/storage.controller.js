angular
  .module('mapcache')
  .controller('StorageController', StorageController);

StorageController.$inject = ['$scope', '$http', 'CacheService', 'SourceService', 'FormatService'];

function StorageController($scope, $http, CacheService, SourceService, FormatService) {

  // $scope.storage = {
  //   total: 8192 * 1024 * 1024,
  //   used: 1000 * 1024 * 1024,
  //   serverTotal: 10240 * 1024 * 1024,
  //   serverFree: 8500 * 1024 * 1024
  // };

  $scope.formatName = function(name) {
    return FormatService[name];
  }

  $http.get('/api/server')
  .success(function(data, status) {
    $scope.storage = data;
  }).error(function(data, status) {
    console.log("error pulling server data", status);
  });

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
    $scope.sources = [];
    for (var i = 0; i < sources.length; i++) {
      if (sources[i].size && sources[i].size != 0) {
        $scope.sources.push(sources[i]);
      }
    }
  });

}

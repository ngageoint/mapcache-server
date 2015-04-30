angular
  .module('mapcache')
  .controller('StorageController', StorageController);

StorageController.$inject = ['$scope', '$http', '$location', 'CacheService', 'SourceService', 'FormatService'];

function StorageController($scope, $http, $location, CacheService, SourceService, FormatService) {

  $scope.formatName = function(name) {
    return FormatService[name];
  }

  $scope.deleteCache = function(cache, format) {
    CacheService.deleteCache(cache, format, function(deletedCache) {
      cache.deleted = true;
    });
  }

  $scope.undeleteCache = function(cache) {
    CacheService.createCache(cache, function(cache) {
      $scope.creatingCache = false;
      $location.path('/cache/'+cache.id);
    }, function(error, status) {
      $scope.cacheCreationError = {error: error, status: status};
    });
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
      if (cache.formats.hasOwnProperty(format) && cache.formats[format]) {
        bytes += cache.formats[format].size;
      }
    }
    return {total: bytes, tileBytes: tileBytes};
  }

  SourceService.getAllSources(true).success(function(sources) {
    $scope.sources = [];
    for (var i = 0; i < sources.length; i++) {
      if (sources[i].size && sources[i].size != 0) {
        sources[i].totalSize = sources[i].size;
        for (var projection in sources[i].projections) {
          if (sources[i].projections.hasOwnProperty(projection) && sources[i].projections[projection] && sources[i].projections[projection].size) {
            sources[i].totalSize += sources[i].projections[projection].size;
          }
        }
        $scope.sources.push(sources[i]);
      }
    }
  });

}

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
      if (!format) {
        cache.deleted = true;
      } else {
        delete cache.formats[format];
      }
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

  $scope.isCacheFormatDeletable = function(cache, format) {
    for (var i = 0; i < cache.source.cacheTypes.length; i++) {
      var ct = cache.source.cacheTypes[i];
      if (ct.type == format && ct.required) {
        return false;
      }
    }
    return true;
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
      caches[i].totalSize = size;
    }
    $scope.caches = caches;
  });

  $scope.deleteSource = function(source, format) {
    SourceService.deleteSource(source, format, function(deletedSource) {
      source.deleted = true;
    });
  }

  function cacheSize(cache) {
    var bytes = 0;
    for (var format in cache.formats) {
      if (cache.formats.hasOwnProperty(format) && cache.formats[format]) {
        var ct = cache.source.cacheTypes;
        var found = false;
        for (var i = 0; i < ct.length && !found; i++) {
          if (ct[i].type == format) {
            console.log('ct[i]', ct[i]);
            found = true;
            if (!ct[i].virtual) {
              console.log('adding', cache.formats[format].size);
              bytes += cache.formats[format].size;
            }
          }
        }
      }
    }
    return bytes;
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

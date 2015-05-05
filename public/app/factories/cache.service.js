angular
  .module('mapcache')
  .factory('CacheService', CacheService);

CacheService.$inject = ['$q', '$http'];

function CacheService($q, $http) {

  var resolvedCaches = {};
  var resolveAllCaches = null;

  var service = {
    getAllCaches: getAllCaches,
    createCache: createCache,
    getCache: getCache,
    deleteCache: deleteCache,
    downloadMissing: downloadMissing
  };

  return service;

  function getCache(cache, success, error) {
    $http.get('/api/caches/'+cache.id)
      .success(function(data, status) {
        if (success) {
          success(data, status);
        }
      }).error(function(data, status) {
        if (error) {
          error(data, status);
        }
      });
  }

  function downloadMissing(cache, success, error) {
    return $http.get('/api/caches/'+cache.id+'/restart');
  }

  function deleteCache(cache, format, success) {
    var url = '/api/caches/' + cache.id;
    if (format) {
      url += '/' + format;
    }
    $http.delete(url).success(function(cache, status, headers, config) {
      console.log('successfully deleted cache', cache);
      if (success) {
        success(cache);
      }
    }).error(function(cache, status, headers, config) {
      console.log('error deleting cache', cache);
    });
  }

  function getAllCaches(forceRefresh) {
    if (forceRefresh) {
        resolvedCaches = {};
        resolveAllCaches = undefined;
    }

    resolveAllCaches = resolveAllCaches || $http.get('/api/caches').success(function(caches) {
      for (var i = 0; i < caches.length; i++) {
        resolvedCaches[caches[i]._id] = $q.when(caches[i]);
      }
    });

    return resolveAllCaches;
  };

  function createCache(cache, success, error, progress) {

    $http.post(
      '/api/caches',
      cache,
      {headers: {"Content-Type": "application/json"}}
    ).success(function(cache, status, headers, config) {
      console.log("created a cache", cache);
      if (success) {
        success(cache);
      }
    }).error(function(data, status, headers, config) {
      if (error) {
        error(data, status);
      }
    });
  }
}

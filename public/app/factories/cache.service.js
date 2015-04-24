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
    getCache: getCache
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

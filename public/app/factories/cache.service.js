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
    createCacheFormat: createCacheFormat,
    getCache: getCache,
    deleteCache: deleteCache,
    getCacheData: getCacheData,
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

  function createCacheFormat(cache, format, success) {
    return $http.get('/api/caches/'+cache.id+'/generate?minZoom='+cache.minZoom+'&maxZoom='+cache.maxZoom+'&format='+format)
    .success(function(data, status, headers, config) {
      if (success) {
        success(cache);
      }
    });
  }

  function createCache(cache, success, error, progress) {
    var newCache = {};
    for (var key in cache) {
      if (cache.hasOwnProperty(key) && key != 'sourceFile' && key != 'data' && key != 'source') {
        newCache[key] = cache[key];
      }
    }
    var newSource = {};
    for (var key in cache.source) {
      if (cache.source.hasOwnProperty(key) && key != 'sourceFile' && key != 'data' ) {
        newSource[key] = cache.source[key];
      }
    }
    newCache.source = newSource;
    $http.post(
      '/api/caches',
      newCache,
      {headers: {"Content-Type": "application/json"}}
    ).success(function(newCache, status, headers, config) {
      console.log("created a cache", newCache);
      if (success) {
        success(newCache);
      }
    }).error(function(data, status, headers, config) {
      if (error) {
        error(data, status);
      }
    });
  }

  function getCacheData(cache, format, success, error) {
    $http.get('/api/caches/'+cache.id+'/' + format + '?minZoom=0&maxZoom=18')
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
}

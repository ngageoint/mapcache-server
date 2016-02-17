module.exports = function CacheService($q, $http) {

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
      .then(function(data, status) {
          if (success) {
            success(data.data, status);
          }
        }, function(data, status) {
          if (error) {
            error(data.data, status);
          }
        });
  }

  function downloadMissing(cache) {
    return $http.get('/api/caches/'+cache.id+'/restart');
  }

  function deleteCache(cache, format, success, error) {
    if (!success && typeof format === 'function') {
      success = format;
      format = undefined;
    }
    var url = '/api/caches/' + cache.id;
    if (format) {
      url += '/' + format;
    }
    $http.delete(url).then(function(cache) {
      if (success) {
        success(cache.data);
      }
    }, function(failure) {
      if (error) {
        error(failure);
      }
    });
  }

  function getAllCaches(forceRefresh) {
    if (forceRefresh) {
        resolvedCaches = {};
        resolveAllCaches = undefined;
    }

    resolveAllCaches = resolveAllCaches || $http.get('/api/caches').then(function(data) {
      return data.data;
    });
    resolveAllCaches.then(function(caches) {
      for (var i = 0; i < caches.length; i++) {
        resolvedCaches[caches[i]._id] = $q.when(caches[i]);
      }
    });

    return resolveAllCaches;
  }

  function createCacheFormat(cache, format, success) {
    return $http.get('/api/caches/'+cache.id+'/generate', { params: {
      minZoom: cache.minZoom,
      maxZoom: cache.maxZoom,
      format: format
    }})
    .then(function() {
      if (success) {
        success(cache);
      }
    });
  }

  function createCache(cache, success, error) {
    var newCache = {};
    for (var key in cache) {
      if (cache.hasOwnProperty(key) && key !== 'sourceFile' && key !== 'data' && key !== 'source') {
        newCache[key] = cache[key];
      }
    }
    var newSource = {};
    for (var sourceKey in cache.source) {
      if (cache.source.hasOwnProperty(sourceKey) && sourceKey !== 'sourceFile' && sourceKey !== 'data' ) {
        newSource[sourceKey] = cache.source[sourceKey];
      }
    }
    newCache.source = newSource;
    $http.post(
      '/api/caches',
      newCache,
      {headers: {"Content-Type": "application/json"}}
    ).then(function(newCache) {
      if (success) {
        success(newCache.data);
      }
    },function(data) {
      if (error) {
        error(data);
      }
    });
  }

  function getCacheData(cache, format, success, error) {
    $http.get('/api/caches/'+cache.id+'/' + format + '?minZoom=0&maxZoom=18')
      .then(function(data) {
        if (success) {
          success(data.data);
        }
      }, function(data) {
        if (error) {
          error(data.data, data.status);
        }
      });
  }
};

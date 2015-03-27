angular
  .module('mapcache')
  .factory('CacheService', CacheService);

CacheService.$inject = ['$rootScope', '$q', '$http', '$location', '$timeout', 'LocalStorageService'];

function CacheService($rootScope, $q, $http, $location, $timeout, LocalStorageService) {

  var resolvedCaches = {};
  var resolveAllCaches = null;

  var service = {
    getAllCaches: getAllCaches
  };

  return service;

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

}

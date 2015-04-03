angular
  .module('mapcache')
  .factory('SourceService', SourceService);

SourceService.$inject = ['$q', '$http'];

function SourceService($q, $http) {

  var resolvedSources = {};
  var resolveAllSources = null;

  var service = {
    getAllSources: getAllSources,
    createSource: createSource
  };

  return service;

  function getAllSources(forceRefresh) {
    if (forceRefresh) {
        resolvedSources = {};
        resolveAllSources = undefined;
    }

    resolveAllSources = resolveAllSources || $http.get('/api/sources').success(function(sources) {
      for (var i = 0; i < sources.length; i++) {
        resolvedSources[sources[i]._id] = $q.when(sources[i]);
      }
    });

    return resolveAllSources;
  };

  function createSources(source, success, error, progress) {

    $http.post(
      '/api/sources',
      source,
      {headers: {"Content-Type": "application/json"}}
    ).success(function(source) {
      console.log("created a source", source);
      if (success) {
        success(source);
      }
    });
  };
}

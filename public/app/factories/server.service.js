module.exports = function ServerService($http) {

  var service = {
    getServerInfo: getServerInfo,
    getMaxCacheSize: getMaxCacheSize
  };

  return service;

  function getServerInfo(success, error) {
    $http.get('/api/server')
    .then(function(data) {
      success(data.data);
    }, error);
  }

  function getMaxCacheSize(success, error) {
    $http.get('/api/server/maxCacheSize')
    .then(function(data) {
      return data.data;
    }).then(success, error);
  }


};

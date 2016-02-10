module.exports = function ServerService($http) {

  var service = {
    getServerInfo: getServerInfo
  };

  return service;

  function getServerInfo(success, error) {
    $http.get('/api/server')
    .success(success).error(error);
  }

};

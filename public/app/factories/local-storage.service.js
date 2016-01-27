angular
  .module('userManagement')
  .factory('LocalStorageService', LocalStorageService);

LocalStorageService.$inject = ['$window'];

function LocalStorageService($window) {
  var tokenKey = 'token';

  var service = {
    getToken: getToken,
    setToken: setToken,
    removeToken: removeToken
  };

  return service;

  function getToken() {
    return getLocalItem(tokenKey);
  }

  function setToken(token) {
    return setLocalItem(tokenKey, token);
  }

  function removeToken() {
    return removeLocalItem(tokenKey);
  }

  function getLocalItem(key) {
    try {
      if ($window.localStorage !== null) {
        return $window.localStorage.getItem(key);
      }
    } catch (e) {
      return false;
    }
  }

  function setLocalItem(key, value) {
    try {
      if ($window.localStorage !== null) {
        return $window.localStorage.setItem(key, value);
      }
    } catch (e) {
      return false;
    }
  }

  function removeLocalItem(key) {
    try {
      if ($window.localStorage !== null) {
        return $window.localStorage.removeItem(key);
      }
    } catch (e) {
      return false;
    }
  }
}

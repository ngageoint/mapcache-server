
module.exports = function ($window) {
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
    console.log('get key %s', key);
    console.log('$window.localStorage', $window.localStorage);
    console.log('$window.localStorage !== null', $window.localStorage !== null);
    try {
      if ($window.localStorage !== null) {
        console.log('returning %s', $window.localStorage.getItem(key));
        return $window.localStorage.getItem(key);
      }
    } catch (e) {
      return false;
    }
  }

  function setLocalItem(key, value) {
    console.log('set key %s to value %s', key, value);
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
};

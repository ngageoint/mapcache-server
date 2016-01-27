angular
  .module('userManagement')
  .factory('UserService', UserService);

UserService.$inject = ['$rootScope', '$q', '$http', '$location', '$timeout', 'LocalStorageService'];

function UserService($rootScope, $q, $http, $location, $timeout, LocalStorageService) {
  var userDeferred = $q.defer();
  var resolvedUsers = {};
  var resolveAllUsers = null;

  var service = {
    myself: null,
    amAdmin: false,
    signup: signup,
    login: login,
    logout: logout,
    getMyself: getMyself,
    updateMyPassword: updateMyPassword,
    updateMyself: updateMyself,
    checkLoggedInUser: checkLoggedInUser,
    getUser: getUser,
    getAllUsers: getAllUsers,
    createUser: createUser,
    updateUser: updateUser,
    deleteUser: deleteUser,
    clearUser: clearUser,
    getRoles: getRoles
  };

  return service;

  function signup(user, success, error, progress) {
    saveUser(user, {
      url: '/api/users',
      type: 'POST'
    }, success, error, progress);
  }

  function login(data) {
    userDeferred = $q.defer();

    var loginDeferred = $q.defer();
    data.appVersion = 'Web Client';
    $http.post(
     '/api/login',
      $.param(data),
      {headers: {"Content-Type": "application/x-www-form-urlencoded"}, ignoreAuthModule:true})
      .success(function(data) {
        LocalStorageService.setToken(data.token);
        setUser(data.user);

        loginDeferred.resolve({user: data.user, token: data.token, isAdmin: service.amAdmin});
      }).error(function(data, status) {
        loginDeferred.reject({data:data, status:status});
      });

    return loginDeferred.promise;
  }

  function logout() {
    var promise =  $http.post('/api/logout');

    promise.success(function() {
      clearUser();
      $location.path("/signin");
    });

    return promise;
  }

  function getMyself(roles) {
    var theDeferred = $q.defer();
    $http.get(
      '/api/users/myself',
      {headers: {"Content-Type": "application/x-www-form-urlencoded"}})
    .success(function(user) {
      setUser(user);

      $rootScope.$broadcast('login', {user: user, token: LocalStorageService.getToken(), isAdmin: service.amAdmin});

      if (roles && !_.contains(roles, user.role.name)) {
        // TODO probably want to redirect to a unauthorized page.
        $location.path('/signin');
      }

      theDeferred.resolve(user);
    })
    .error(function() {
      theDeferred.resolve({});
    });

    return theDeferred.promise;
  }

  function updateMyself(user, success, error, progress) {
    saveUser(user, {
      url: '/api/users/myself?access_token=' + LocalStorageService.getToken(),
      type: 'PUT'
    }, success, error, progress);
  }

  function updateMyPassword(user) {
    var promise = $http.put(
      '/api/users/myself',
      $.param(user),
      {headers: {"Content-Type": "application/x-www-form-urlencoded"}}
    );

    promise.success(function() {
      clearUser();
    });

    return promise;
  }

  function checkLoggedInUser() {
    console.info('check login');
    $http.get(
      '/api/users/myself',
      {
        ignoreAuthModule: true})
    .success(function(user) {
      setUser(user);
      userDeferred.resolve(user);
    })
    .error(function() {
      userDeferred.resolve({});
    });

    return userDeferred.promise;
  }

  function getUser(id) {
    resolvedUsers[id] = resolvedUsers[id] || $http.get(
      '/api/users/' + id
    );
    return resolvedUsers[id];
  }

  function getAllUsers(forceRefresh) {
    if (forceRefresh) {
        resolvedUsers = {};
        resolveAllUsers = undefined;
    }

    resolveAllUsers = resolveAllUsers || $http.get('/api/users').success(function(users) {
      for (var i = 0; i < users.length; i++) {
        resolvedUsers[users[i]._id] = $q.when(users[i]);
      }
    });

    return resolveAllUsers;
  }

  function createUser(user, success, error, progress) {
    saveUser(user, {
      url: '/api/users?access_token=' + LocalStorageService.getToken(),
      type: 'POST'
    }, success, error, progress);
  }

  function updateUser(id, user, success, error, progress) {
    saveUser(user, {
      url: '/api/users/' + id + '?access_token=' + LocalStorageService.getToken(),
      type: 'PUT'
    }, success, error, progress);
  }

  function deleteUser(user) {
    return $http.delete(
      '/api/users/' + user.id
    );
  }

  // TODO is this really used in this service or just internal
  function clearUser() {
    service.myself = null;
    service.amAdmin = null;
    LocalStorageService.removeToken();

    $rootScope.$broadcast('logout');
  }

  // TODO should this go in Roles service/resource
  function getRoles() {
    return $http.get('/api/roles');
  }


  function setUser(user) {
    service.myself = user;
    service.amAdmin = service.myself && service.myself.role && (service.myself.role.name === "ADMIN_ROLE");
  }

  function saveUser(user, options, success, error, progress) {
    var formData = new FormData();
    for (var property in user) {
      if (user[property] !== null)
        formData.append(property, user[property]);
    }

    $.ajax({
        url: options.url,
        type: options.type,
        xhr: function() {
            var myXhr = $.ajaxSettings.xhr();
            if(myXhr.upload){
                myXhr.upload.addEventListener('progress', progress, false);
            }
            return myXhr;
        },
        success: success,
        error: error,
        data: formData,
        cache: false,
        contentType: false,
        processData: false
    });
  }
}

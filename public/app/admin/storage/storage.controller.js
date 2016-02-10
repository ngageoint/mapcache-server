var _ = require('underscore');

module.exports = function StorageController($scope, $http, $location, $injector, CacheService, MapService, FormatService, LocalStorageService, UserService, ServerService) {

  $scope.formatName = function(name) {
    return FormatService[name];
  };

  $scope.deleteCache = function(cache, format) {
    CacheService.deleteCache(cache, format, function() {
      if (!format) {
        cache.deleted = true;
      } else {
        delete cache.formats[format];
      }
    });
  };

  $scope.undeleteCache = function(cache) {
    CacheService.createCache(cache, function(cache) {
      $location.path('/cache/'+cache.id);
    }, function(error, status) {
      $scope.cacheCreationError = {error: error, status: status};
    });
  };

  ServerService.getServerInfo(function(data) {
    $scope.storage = data;
  });

  CacheService.getAllCaches(true).then(function(caches) {
    if (caches.data) caches = caches.data;
    console.log('caches server.length', caches.length);

    for (var i = 0; i < caches.length; i++) {
      var size = cacheSize(caches[i]);
      caches[i].totalSize = size;
    }
    $scope.caches = caches;
    console.log('caches.length', $scope.caches.length);
  });

  $scope.deleteMap = function(source) {
    MapService.deleteMap(source, function() {
      source.deleted = true;
    });
  };

  function cacheSize(cache) {
    var bytes = 0;
    for (var format in cache.formats) {
      if (cache.formats.hasOwnProperty(format) && cache.formats[format]) {
              bytes += cache.formats[format].size;
      }
    }
    return bytes;
  }

  MapService.getAllMaps(true).then(function(sources) {
    if (sources.data) sources = sources.data;
    $scope.sources = [];
    for (var i = 0; i < sources.length; i++) {
      var totalSize = 0;
      for (var dsIdx = 0; dsIdx < sources[i].dataSources.length; dsIdx++) {
        if (sources[i].dataSources[dsIdx].size) {
          totalSize+= sources[i].dataSources[dsIdx].size;
        }
      }
      sources[i].totalSize = totalSize;
      $scope.sources.push(sources[i]);
    }
  });

  $scope.token = LocalStorageService.getToken();
  $scope.filter = "all"; // possible values all, active, inactive
  $scope.users = [];
  $scope.roles = [];
  $scope.page = 0;
  $scope.itemsPerPage = 10;

  UserService.getRoles().then(function (roles) {
    $scope.roles = roles;
  });

  UserService.getAllUsers(true).then(function(users) {
    if (users.data) users = users.data;
    $scope.users = users;
  });

  $scope.filterActive = function (user) {
    switch ($scope.filter) {
      case 'all': return true;
      case 'active': return user.active;
      case 'inactive': return !user.active;
    }
  };

  $scope.newUser = function() {
    $scope.user = {};
  };

  $scope.editUser = function(user) {
    // TODO temp code to convert array of phones to one phone
    if (user.phones && user.phones.length > 0) {
      user.phone = user.phones[0].number;
    }

    $scope.user = user;
  };

  var debounceHideSave = _.debounce(function() {
    $scope.$apply(function() {
      $scope.saved = false;
    });
  }, 5000);

  $scope.saveUser = function () {
    $scope.saving = true;
    $scope.error = false;

    var user = {
      username: $scope.user.username,
      firstname: $scope.user.firstname,
      lastname: $scope.user.lastname,
      email: $scope.user.email,
      phone: $scope.user.phone,
      password: this.user.password,
      passwordconfirm: this.user.passwordconfirm,
      roleId: $scope.user.roleId
    };

    var failure = function(response) {
      $scope.saving = false;
      $scope.error = response.responseText;
    };

    var progress = function(e) {
      if(e.lengthComputable){
        $scope.uploading = true;
        $scope.uploadProgress = (e.loaded/e.total) * 100;
      }
    };

    if ($scope.user.id) {
      UserService.updateUser($scope.user.id, user, function() {
        $scope.saved = true;
        $scope.saving = false;
        debounceHideSave();
      }, failure, progress);
    } else {
      UserService.createUser(user, function(response) {
        $scope.saved = true;
        $scope.saving = false;
        debounceHideSave();
        $scope.users.push(response);
      }, failure, progress);
    }
  };

  $scope.deleteUser = function(user) {
    var modalInstance = $injector.get('$modal').open({
      templateUrl: '/app/admin/users/user-delete.html',
      resolve: {
        user: function () {
          return user;
        }
      },
      controller: ['$scope', '$modalInstance', 'user', function ($scope, $modalInstance, user) {
        $scope.user = user;

        $scope.deleteUser = function(user) {
          UserService.deleteUser(user).success(function() {
            $modalInstance.close(user);
          });
        };
        $scope.cancel = function () {
          $modalInstance.dismiss('cancel');
        };
      }]
    });

    modalInstance.result.then(function(user) {
      $scope.user = null;
      $scope.users = _.reject($scope.users, function(u) { return u.id === user.id;});
    });
  };

  $scope.refresh = function() {
    $scope.users = [];
    UserService.getAllUsers(true).then(function (users) {
      $scope.users = users;
    });
  };

  /* shortcut for giving a user the USER_ROLE */
  $scope.activateUser = function (user) {
    UserService.updateUser(user.id, user, function() {
      $scope.saved = true;
      user.active = true;
      debounceHideSave();
    }, function(response) {
      user.active = false;
      $scope.error = response.responseText;
    });
  };

};

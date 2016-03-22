window.jQuery = window.$ = require("jquery");
var angular = require('angular');
require('angular-route');
require('angular-sanitize');
require('./app/auth/http-auth-interceptor');
require('angular-ui-bootstrap');
require('angular-ui-scrollpoint');
// putting this  because you have to build it before you can use it
require('./vendor/angular_ui_select');

// fix the image path
var L = require('leaflet');
L.Icon.Default.imagePath = 'node_modules/leaflet/dist/images/';

var app = angular.module('mapcache', [ 'ngRoute', 'ngSanitize', 'http-auth-interceptor', 'ui.bootstrap', 'ui.select', 'ui.scrollpoint' ]);

require('./app/signin');
require('./app/factories');
require('./app/filters');
require('./app/mapcache');
require('./app/admin/storage');
require('./app/user');
require('./app/about');
require('./app/directives');

app.config(function($routeProvider, $httpProvider) {

  $httpProvider.defaults.withCredentials = true;
  $httpProvider.defaults.headers.post  = {'Content-Type': 'application/x-www-form-urlencoded'};

  function resolveLogin(roles) {
    return {
      user: function(UserService) {
       return UserService.getMyself(roles);
     }
   };
  }

  function checkLogin(roles) {
    return {
      user: function(UserService) {
        return UserService.checkLoggedInUser(roles);
      }
    };
  }

  $routeProvider.when('/signin', {
    templateUrl: 'app/signin/signin.html',
    controller: 'SigninController',
    resolve: checkLogin()
  }).when('/admin', {
    templateUrl:    'app/admin/storage/storage.html',
    controller:     "StorageController",
    resolve: resolveLogin(["ADMIN_ROLE"])
  }).when('/maps', {
    templateUrl:    'app/mapcache/maps.html',
    controller:     "MapsController",
    resolve: resolveLogin(["USER_ROLE", "ADMIN_ROLE"])
  }).when('/mapcache', {
    templateUrl:    'app/mapcache/mapcache.html',
    controller:     'MapcacheController',
    resolve: resolveLogin(["USER_ROLE", "ADMIN_ROLE"])
  }).when('/create/:mapId?', {
    templateUrl:    'app/mapcache/cache/create.html',
    controller:     "MapcacheCreateController",
    resolve: resolveLogin(["USER_ROLE", "ADMIN_ROLE"])
  }).when('/cache/:cacheId', {
    templateUrl:    'app/mapcache/cache/cache.html',
    controller:     "MapcacheCacheController",
    resolve: resolveLogin(["USER_ROLE", "ADMIN_ROLE"])
  }).when('/map', {
    templateUrl:    'app/mapcache/map/map-create.html',
    controller:     "MapCreateController",
    resolve: resolveLogin(["USER_ROLE", "ADMIN_ROLE"])
  }).when('/map/:mapId/edit', {
    templateUrl:    'app/mapcache/map/map-edit.html',
    controller:     "MapEditController",
    resolve: resolveLogin(["USER_ROLE", "ADMIN_ROLE"])
  }).when('/map/:mapId', {
    templateUrl:    'app/mapcache/map/map.html',
    controller:     "MapController",
    resolve: resolveLogin(["USER_ROLE", "ADMIN_ROLE"])
  }).when('/user', {
    templateUrl:    "app/user/user.html",
    controller:      "UserController",
    resolve: resolveLogin(["USER_ROLE", "ADMIN_ROLE"])
  }).when('/about', {
    templateUrl:    "app/about/about.html",
    controller:     "AboutController",
    resolve: resolveLogin(["USER_ROLE", "ADMIN_ROLE"])
  })
  .otherwise({
    redirectTo: '/signin',
  });
});

app.run(function($rootScope, $modal, UserService, $location) {
  $rootScope.$on('event:auth-loginRequired', function() {
    if (!$rootScope.loginDialogPresented && $location.path() !== '/' && $location.path() !== '/signin' && $location.path() !== '/signup') {
      $rootScope.loginDialogPresented = true;
      var modalInstance = $modal.open({
        backdrop: 'static',
        templateUrl: 'app/signin/signin-modal.html',
        controller: ['$scope', '$modalInstance', 'authService', function ($scope, $modalInstance, authService) {
          var oldUsername = UserService.myself && UserService.myself.username || undefined;
          $scope.signin = function () {
            var data = {username: this.username, password: this.password};
            UserService.login(data).then(function (data) {
              if (data.username !== oldUsername) {
                data.newUser = true;
              }
              authService.loginConfirmed(data);
              $rootScope.loginDialogPresented = false;
              $modalInstance.close($scope);
              $rootScope.$broadcast('login', data);

            },
            function (data) {
              $scope.status = data.status;
            });
          };

          $scope.cancel = function () {
            $rootScope.loginDialogPresented = false;
            $modalInstance.dismiss('cancel');
          };
        }]
      });

      modalInstance.result.then(function () {
      });
    }

  });

  $rootScope.$on('event:auth-loginConfirmed', function() {
  });
});

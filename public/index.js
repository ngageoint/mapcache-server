var angular = require('angular');
require('angular-route');
require('./app/auth/http-auth-interceptor');

var app = angular.module('mapcache', [ 'ngRoute', 'http-auth-interceptor' ]);

require('./app/signin');
require('./app/factories');
require('./app/filters');
require('./app/mapcache');

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
  }).when('/mapcache', {
    templateUrl:    'app/mapcache/mapcache.html',
    controller:     'MapcacheController',
    resolve: resolveLogin(["USER_ROLE", "ADMIN_ROLE"])
  })
  .otherwise({
    redirectTo: '/signin',
  });
});

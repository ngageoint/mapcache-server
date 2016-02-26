
module.exports = function($rootScope, $scope, $location, UserService) {
  $scope.location = $location;
  $scope.logout = UserService.logout;

  $rootScope.$on('login', function(e, login) {
    $scope.token = login.token;
    $scope.myself = login.user;
    $scope.amAdmin = login.isAdmin;

    if ($location.path() === '/signin') {
      $location.path('/mapcache');
    }
  });

  $rootScope.$on('logout', function() {
    $scope.myself = null;
    $scope.amAdmin = null;
    $scope.token = null;
  });

};

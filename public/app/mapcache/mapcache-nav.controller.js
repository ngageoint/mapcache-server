
module.exports = function($rootScope, $scope, $location, UserService) {
console.log('mapcache nav controller');
  $scope.location = $location;

  $rootScope.$on('login', function(e, login) {
    console.log('login caught', login);
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
  });

  $scope.logout = function() {
    UserService.logout();
  };

};

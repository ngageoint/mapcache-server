angular
  .module('mapcache')
  .controller('NavController', NavController);

NavController.$inject =  ['$rootScope', '$scope', '$q', '$location', '$modal', 'UserService'];

function NavController($rootScope, $scope, $q, $location, $modal, UserService) {

  $scope.location = $location;

  $rootScope.$on('login', function(e, login) {
    $scope.token = login.token;
    $scope.myself = login.user;
    $scope.amAdmin = login.isAdmin;

    if ($location.path() == '/signin') {
      $location.path('/mapcache');
    }
  });

  $rootScope.$on('logout', function() {
    $scope.myself = null;
    $scope.amAdmin = null;
  });

  $scope.logout = function() {
    UserService.logout();
  }

}

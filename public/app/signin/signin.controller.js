angular
  .module('userManagement')
  .controller('SigninController', SigninController);

SigninController.$inject = ['$scope', '$rootScope', '$location', 'UserService'];

function SigninController($scope, $rootScope, $location, UserService) {
  $scope.status = 0;

  $scope.signin = function () {
    UserService.login({username: this.username, password: this.password, uid: this.uid})
      .then(function (data) {
        $rootScope.$broadcast('login', data);
      },
      function (data) {
        $scope.status = data.status;
      });
  }
}

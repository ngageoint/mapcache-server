var angular = require('angular');
module.exports = function UserController($scope, $location, $timeout, UserService, user) {
  $scope.user = user;
  $scope.originalUser = angular.copy(user);
  $scope.passwordStatus = {};
  $scope.showUserStatus = false;

  $scope.saveUser = function() {
    var user = {
      username: this.user.username,
      firstname: this.user.firstname,
      lastname: this.user.lastname,
      email: this.user.email,
      phone: this.user.phone
    };

    var complete = function() {
      $scope.$apply(function() {
        $scope.status("Success", "Your account information has been updated.", "alert-success");
      });
    };

    var failed = function(data) {
      $scope.$apply(function() {
        $scope.status("Error", data, "alert-danger");
      });
    };

    UserService.updateMyself(user, complete, failed);
  };

  $scope.cancel = function() {
    $scope.user = angular.copy($scope.originalUser);
  };

  $scope.updatePassword = function() {
    if (!this.user.password) {
      $scope.passwordStatus = {status: "error", msg: "password cannot be blank"};
      return;
    }

    if (this.user.password !== this.user.passwordconfirm) {
      $scope.passwordStatus = {status: "error", msg: "passwords do not match"};
      return;
    }

    var user = {
      password: this.user.password,
      passwordconfirm: this.user.passwordconfirm
    };

    UserService.updateMyPassword(user)
      .then(function() {
        $scope.user.password = "";
        $scope.user.passwordconfirm = "";
        $scope.passwordStatus = {status: "success", msg: "password successfully updated, redirecting to the login page"};

        $timeout(function() {
          $location.path('/signin');
        }, 5000);
      }, function(data) {
        $scope.passwordStatus = {status: "error", msg: data};
      });
  };

  $scope.status = function (statusTitle, statusMessage, statusLevel) {
    $scope.statusTitle = statusTitle;
    $scope.statusMessage = statusMessage;
    $scope.statusLevel = statusLevel;
    $scope.showUserStatus = true;
  };

};

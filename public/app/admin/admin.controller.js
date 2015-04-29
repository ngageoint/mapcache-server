angular
  .module('userManagement')
  .controller('AdminController', AdminController);

AdminController.$inject = ['$scope', '$routeParams'];

function AdminController($scope, $routeParams) {
  $scope.currentAdminPanel = $routeParams.adminPanel || "storage";
}

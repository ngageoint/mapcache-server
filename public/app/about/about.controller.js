angular
  .module('userManagement')
  .controller('AboutController', AboutController);

AboutController.$inject = ['$scope'];

function AboutController ($scope) {
  $scope.about = 'About';
}

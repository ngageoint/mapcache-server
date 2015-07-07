angular
  .module('mapcache')
  .directive('styleRow', styleRow);

function styleRow() {
  var directive = {
    restrict: "A",
    templateUrl: 'app/mapcache/vector-style/directives/style-row.html',
    replace: true,
    scope: {
      style: '=styleRow',
      options: '='
    },
    controller: StyleRowController
  };

  return directive;
}

StyleRowController.$inject = ['$scope', '$element'];

function StyleRowController($scope, $element) {

  $scope.deleteStyle = function(style) {
    $scope.$emit('deleteStyle', style);
  }

  $scope.promoteStyle = function(style) {
    $scope.$emit('promoteStyle', style);
  }

  $scope.demoteStyle = function(style) {
    $scope.$emit('demoteStyle', style);
  }

  $scope.addStyle = function(style) {
    $scope.$emit('addStyle', style);
  }

}

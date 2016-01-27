angular
  .module('mapcache')
  .directive('colorPicker', colorPicker);

function colorPicker() {
  var directive = {
    restrict: "A",
    scope: {
      colorPicker: '='
    },
    controller: ColorPickerController
  };

  return directive;
}

ColorPickerController.$inject = ['$scope', '$element'];

function ColorPickerController($scope, $element) {

  $scope.$watch('colorPicker', initialize);
  var initialized = false;

  function initialize() {
    console.log('color picker', $scope.colorPicker);
    if (!$scope.colorPicker) return;
    if (initialized) {
      $element.colorpicker('setValue', $scope.colorPicker);
    } else {
      $element.colorpicker({color: $scope.colorPicker}).on('changeColor.colorpicker', function(event){
        if ($scope.colorPicker.toUpperCase() !== event.color.toHex().toUpperCase()) {
          $scope.$apply(function() {
            $scope.colorPicker = event.color.toHex();
          });
        }
      });
    }
    initialized = true;
  }

  initialize();
}

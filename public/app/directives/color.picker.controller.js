var jQuery = require("jquery")(window);
require('bootstrap-colorpicker');

module.exports = function ColorPickerController($scope, $element) {

  $scope.$watch('colorPicker', initialize);
  var initialized = false;

  function initialize() {
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
};

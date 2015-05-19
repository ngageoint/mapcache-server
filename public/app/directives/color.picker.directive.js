$(function(){
    $('.demo2').colorpicker();
});

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

  function initialize() {
    console.log('color picker', $scope.colorPicker);
    $element.colorpicker({color: $scope.colorPicker}).on('changeColor.colorpicker', function(event){
      $scope.$apply(function() {
        $scope.colorPicker = event.color.toHex();
      });
    });
  }

  initialize();
}

module.exports = function colorPicker() {
  var directive = {
    restrict: "A",
    scope: {
      colorPicker: '='
    },
    controller: 'ColorPickerController'
  };

  return directive;
};

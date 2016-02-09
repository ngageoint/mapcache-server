module.exports = function locationChooser() {
  var directive = {
    restrict: "A",
    templateUrl: 'app/directives/location-chooser.directive.html',
    scope: {
      accept: '=',
      locationStatus: '='
    },
    controller: 'LocationChooserController',
    bindToController: true
  };

  return directive;
};

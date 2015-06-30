angular
  .module('mapcache')
  .directive('locationChooser', locationChooser);

function locationChooser() {
  var directive = {
    restrict: "A",
    templateUrl: '/app/directives/location-chooser.directive.html',
    scope: {
      accept: '=',
      locationStatus: '='
    },
    controller: LocationChooserController,
    bindToController: true
  }

  return directive;
}

LocationChooserController.$inject = ['$scope', '$element'];

function LocationChooserController($scope, $element) {

  $element.find(':file').bind('change', function() {
    console.log('in the file change');
    console.log('this.files', this.files);
    $scope.file = this.files[0];
    if ($scope.file) {
      $scope.location = $scope.file.name;
    }
    $scope.$emit('uploadFile', $scope.file);
    $scope.$apply();
  });

  function isValidURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)'+ // protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
      '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    if(!pattern.test(str)) {
      return false;
    } else {
      return true;
    }
  }

  $scope.$watch('location', function(location, oldLocation) {
    if (location) {
      $scope.$emit('location-url', location, isValidURL(location));
      $scope.file = {};
      $element.find(':file').val('');
    }
  });
}

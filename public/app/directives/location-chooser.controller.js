module.exports = function LocationChooserController($scope, $element) {

  $scope.placeholder = $scope.placeholder || 'e.g. http://osm.geointservices.io/osm_tiles';

  $scope.$watch('file', function() {
    if ($scope.file) {
      $scope.location = $scope.file.name;
    }
  });

  $element.find(':file').bind('change', function(event) {
    $scope.$apply(function() {
      if (event.target.files.length === 1) {
        $scope.file = event.target.files[0];
        $scope.$emit('location-file', $scope.file);
      } else if (event.target.files.length !== 0) {
        $scope.file = event.target.files[0];
        $scope.$emit('location-file', $scope.file);
        $scope.$emit('location-files', event.target.files);
      }
    });
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

  $scope.$watch('location', function(location) {
    if (!location) return;
    if (isValidURL(location)) {
      $scope.$emit('location-url', location, isValidURL(location));
    } else {
      $scope.$emit('location-text', location);
    }
  });
};

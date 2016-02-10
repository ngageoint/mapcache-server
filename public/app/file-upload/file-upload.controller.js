module.exports = function FileUploadController($scope, $element) {

  $element.find(':file').bind('change', function() {
    console.log('in the file change');
    $scope.file = this.files[0];
    if ($scope.file) {
      $scope.fileSelected = true;
    } else {
      $scope.fileSelected = false;
    }
    $scope.$emit('uploadFile', $scope.file);
    $scope.$apply();
  });

  $scope.$on('clearFile', function() {
    $scope.file = {};
    $scope.fileSelected = false;
  });
};

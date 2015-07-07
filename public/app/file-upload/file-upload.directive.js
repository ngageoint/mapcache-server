angular
  .module('mapcache')
  .directive('fileUpload', fileUpload);

function fileUpload() {
  var directive = {
    restrict: "A",
    templateUrl: '/app/file-upload/file-upload.directive.html',
    scope: {
      accept: '='
    },
    controller: FileUploadController,
    bindToController: true
  }

  return directive;
}

FileUploadController.$inject = ['$scope', '$element'];

function FileUploadController($scope, $element) {

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
}

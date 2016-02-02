module.exports = function fileUpload() {
  var directive = {
    restrict: "A",
    templateUrl: '/app/file-upload/file-upload.directive.html',
    scope: {
      accept: '='
    },
    controller: 'FileUploadController',
    bindToController: true
  };

  return directive;
};

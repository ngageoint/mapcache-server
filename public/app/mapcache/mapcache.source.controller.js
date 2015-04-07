angular
  .module('mapcache')
  .controller('MapcacheSourceController', MapcacheSourceController);

MapcacheSourceController.$inject = [
  '$scope',
  '$location',
  'CacheService',
  'SourceService'
];

function MapcacheSourceController($scope, $location, CacheService, SourceService) {

  $scope.source = {

  };

  var uploadProgress = function(e) {
    if(e.lengthComputable){
      $scope.$apply(function() {
        $scope.uploading = true;
        $scope.uploadProgress = (e.loaded/e.total) * 100;
        console.log('uploadprogress ' + $scope.uploadProgress);
      });
    }
  }

  $scope.createSource = function() {
    console.log($scope.cache);
    SourceService.createSource($scope.source, function(source) {
      console.log('source created', source);
    }, function() {
      console.log("error");
    }, uploadProgress);
  }

  $scope.$on('uploadFile', function(e, uploadFile) {
    console.log(uploadFile);
    $scope.source.sourceFile = uploadFile;
  });

};

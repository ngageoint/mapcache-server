angular
  .module('mapcache')
  .controller('MapcacheSourceCreateController', MapcacheSourceCreateController);

MapcacheSourceCreateController.$inject = [
  '$scope',
  '$location',
  '$timeout',
  'CacheService',
  'SourceService'
];

function MapcacheSourceCreateController($scope, $location, $timeout, CacheService, SourceService) {

  $scope.source = {
    format: 'xyz'
  };

  var uploadProgress = function(e) {
    if(e.lengthComputable){
      $scope.$apply(function() {
        $scope.progress = (e.loaded/e.total) * 100;
        console.log('uploadprogress ' + $scope.progress);
      });
    }
  }

  $scope.createSource = function() {
    console.log($scope.cache);
    $scope.sourceSubmitted = true;
    SourceService.createSource($scope.source, function(source) {
      console.log('source created', source);
      // now start a timer to watch the source be created
      $location.path('/source/'+source.id);
    }, function() {
      console.log("error");
    }, uploadProgress);
  }

  $scope.$on('uploadFile', function(e, uploadFile) {
    console.log(uploadFile);
    $scope.source.sourceFile = uploadFile;
  });

  function getSourceProgress() {
    SourceService.refreshSource($scope.source, function(source) {
      // success
      $scope.source = source;
      if (!source.complete) {
        $timeout(getSourceProgress, 5000);
      }
    }, function(data) {
      // error
    });
  }

};

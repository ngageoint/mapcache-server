var _ = require('underscore');
var config = require('../../config');

module.exports = function MapCreateController($scope, $rootScope, $location, MapService) {
  $rootScope.title = 'Create A Map';

  $scope.validUrlFormats = MapService.validUrlFormats;
  $scope.validFileFormats = MapService.validFileFormats;

  $scope.dataSources = [{}];
  $scope.dataSourcesValidated = false;
  $scope.dataSourceTotalFileSize = 0;

  $scope.map = {
    permission: 'MAPCACHE',
    dataSources: [{
      zOrder: 0
    }]
  };

  $scope.mapOptions = {
    baseLayerUrl: config.defaultMapLayer,
    opacity: 0.5
  };

  $scope.$watch('map.dataSources.length', function() {
    $scope.$watch('map.dataSources['+($scope.map.dataSources.length-1)+'].valid', validateSources);
  });

  function validateSources() {
    $scope.dataSourceTotalFileSize = 0;
    $scope.dataSourcesValidated = _.every($scope.map.dataSources, function(value) {
      $scope.dataSourceTotalFileSize += value.file ? value.file.size : 0;
      return value.valid;
    });
  }

  var uploadProgress = function(e) {
    if(e.lengthComputable){
      $scope.$apply(function() {
        $scope.progress = (e.loaded/e.total) * 100;
      });
    }
  };

  $scope.addDataSource = function(file) {
    $scope.map.dataSources.push({
      zOrder: $scope.map.dataSources.length,
      file: file
    });
  };

  $scope.createMap = function() {
    $scope.mapSubmitted = true;
    MapService.createMap($scope.map, function(map) {
      // now start a timer to watch the map be created
      $location.path('/map/'+map.id);
    }, function() { }, uploadProgress);
  };

  $scope.$on('location-files', function(e, files) {
    for (var i = 1; i < files.length; i++) {
      $scope.addDataSource(files[i]);
    }
  });

};

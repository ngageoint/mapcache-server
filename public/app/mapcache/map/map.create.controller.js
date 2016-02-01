var _ = require('underscore');

module.exports = function MapCreateController($scope, $rootScope, $location, $timeout, $http, CacheService, MapService) {
  $rootScope.title = 'Create A Map';

  $scope.validUrlFormats = MapService.validUrlFormats;
  $scope.validFileFormats = MapService.validFileFormats;

  $scope.dataSources = [{}];
  $scope.dataSourcesValidated = false;
  $scope.dataSourceTotalFileSize = 0;

  $scope.map = {
    dataSources: [{
      zOrder: 0
    }]
  };

  $scope.mapOptions = {
    baseLayerUrl: 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png',
    opacity: 0.5
  };

  $scope.$watch('map.dataSources.length', function() {
    $scope.$watch('map.dataSources['+($scope.map.dataSources.length-1)+'].valid', validateSources);
  });

  function validateSources() {
    console.log('validate sources');
    $scope.dataSourceTotalFileSize = 0;
    if (!$scope.map.dataSources) $scope.dataSourcesValidated = false;

    else $scope.dataSourcesValidated = _.every($scope.map.dataSources, function(value) {
      $scope.dataSourceTotalFileSize += value.file ? value.file.size : 0;
      return value.valid;
    });
  }

  var uploadProgress = function(e) {
    if(e.lengthComputable){
      $scope.$apply(function() {
        $scope.progress = (e.loaded/e.total) * 100;
        console.log('uploadprogress ' + $scope.progress);
      });
    }
  };

  $scope.addDataSource = function() {
    $scope.map.dataSources.push({
      zOrder: $scope.map.dataSources.length
    });
  };

  $scope.createMap = function() {
    console.log($scope.cache);
    $scope.mapSubmitted = true;
    MapService.createMap($scope.map, function(map) {
      console.log('map created', map);
      // now start a timer to watch the map be created
      $location.path('/map/'+map.id);
    }, function() {
      console.log("error");
    }, uploadProgress);
  };

};

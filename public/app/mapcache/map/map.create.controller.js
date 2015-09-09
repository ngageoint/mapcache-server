angular
  .module('mapcache')
  .controller('MapCreateController', MapCreateController);

MapCreateController.$inject = [
  '$scope',
  '$rootScope',
  '$location',
  '$timeout',
  '$http',
  'CacheService',
  'MapService'
];

function MapCreateController($scope, $rootScope, $location, $timeout, $http, CacheService, MapService) {
  $rootScope.title = 'Create A Map';

  $scope.validUrlFormats = MapService.validUrlFormats;
  $scope.validFileFormats = MapService.validFileFormats;

  $scope.dataSources = [{}];
  $scope.dataSourcesValidated = false;

  $scope.map = {
    dataSources: [{
      zOrder: 0
    }]
  };

  $scope.mapOptions = {
    baseLayerUrl: 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png',
    opacity: .5
  };

  $scope.$watch('map.dataSources', function(dataSources) {
    if (!dataSources) return;
    $scope.dataSourcesValidated = _.every(dataSources, function(value) { return value.valid; });
  }, true);

  var uploadProgress = function(e) {
    if(e.lengthComputable){
      $scope.$apply(function() {
        $scope.progress = (e.loaded/e.total) * 100;
        console.log('uploadprogress ' + $scope.progress);
      });
    }
  }

  $scope.addDataSource = function() {
    $scope.map.dataSources.push({
      zOrder: $scope.map.dataSources.length
    });
  }

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
  }

  function getMapProgress() {
    MapService.refreshMap($scope.map, function(map) {
      // success
      $scope.map = map;
      if (!map.complete) {
        $timeout(getMapProgress, 5000);
      }
    }, function(data) {
      // error
    });
  }

};

angular
  .module('mapcache')
  .controller('MapcacheCreateController', MapcacheCreateController);

MapcacheCreateController.$inject = [
  '$scope',
  '$location',
  'CacheService',
  'SourceService'
];

function MapcacheCreateController($scope, $location, CacheService, SourceService) {

  $scope.cache = {
    format: "xyz"
  };

  SourceService.getAllSources(true).success(function(sources) {
    $scope.sources = sources;
  });

  $scope.$watch('cache.geometry', function(geometry) {
    if (!geometry) {
      $scope.north = null;
      $scope.south = null;
      $scope.west = null;
      $scope.east = null;
      return;
    }

    var extent = turf.extent(geometry);
    $scope.north = extent[3];
    $scope.south = extent[1];
    $scope.west = extent[0];
    $scope.east = extent[2];
  });

  $scope.createCache = function() {
    console.log($scope.cache);
    CacheService.createCache($scope.cache);
  }

  $scope.createSource = function() {
    $location.path('/source');
  }
};

angular
  .module('mapcache')
  .controller('MapcacheCreateController', MapcacheCreateController);

MapcacheCreateController.$inject = [
  '$scope',
  '$rootScope',
  '$compile',
  '$timeout',
  '$location',
  'LocalStorageService',
  'CacheService'
];

function MapcacheCreateController($scope, $rootScope, $compile, $timeout, $location, LocalStorageService, CacheService) {

  $scope.cache = {
    format: "xyz"
  };

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
    $scope.cache.source = {
      url: $scope.cache.url
    };
    CacheService.createCache($scope.cache);
  }
};

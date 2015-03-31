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

  $scope.cache = {};

  $scope.$watch('cache.geometry', function(geometry) {
    if (!geometry) {
      $scope.north = null;
      $scope.south = null;
      $scope.west = null;
      $scope.east = null;
      return;
    }

    var gj = L.geoJson(geometry);
    var bounds = gj.getLayers()[0].getBounds();

    $scope.north = bounds.getNorth();
    $scope.south = bounds.getSouth();
    $scope.west = bounds.getWest();
    $scope.east = bounds.getEast();
  });

  $scope.createCache = function() {
    console.log($scope.cache);
    $scope.cache.source = {
      url: $scope.cache.url
    };
    CacheService.createCache($scope.cache);
  }
};

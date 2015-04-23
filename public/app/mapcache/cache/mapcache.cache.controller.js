angular
  .module('mapcache')
  .controller('MapcacheCacheController', MapcacheCacheController);

MapcacheCacheController.$inject = [
  '$scope',
  '$location',
  '$timeout',
  '$routeParams',
  'CacheService'
];

function MapcacheCacheController($scope, $location, $timeout, $routeParams, CacheService) {

  $scope.mapOptions = {
    baseLayerUrl: 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png',
    opacity: .14
  };

  $scope.cache = {
    id: $routeParams.cacheId
  };

  $scope.createAnotherCache = function() {
    $location.path('/create');
  }

  $scope.returnToList = function () {
    $location.path('/mapcache');
  };

  function getCache() {
    CacheService.getCache($scope.cache, function(cache) {
      // success
      $scope.cache = cache;
    }, function(data) {
      // error
    });
  }

  getCache();

};

angular
  .module('mapcache')
  .controller('MapcacheController', MapcacheController);

MapcacheController.$inject = [
  '$scope',
  '$rootScope',
  '$compile',
  '$timeout',
  'LocalStorageService',
  'CacheService'
];

function MapcacheController($scope, $rootScope, $compile, $timeout, LocalStorageService, CacheService) {

  CacheService.getAllCaches().success(function(caches) {
    $scope.caches = caches;
  });

  $scope.mouseOver = function(cache) {
    console.log("mouse over " + cache.name);
    $rootScope.$broadcast('cacheHighlight', cache);
  }

  $scope.mouseOut = function(cache) {
    console.log("mouse out " + cache.name);
    $rootScope.$broadcast('cacheUnhighlight', cache);
  }
};

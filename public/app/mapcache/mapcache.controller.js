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
    $rootScope.$broadcast('cacheHighlight', cache);
  }

  $scope.mouseOut = function(cache) {
    $rootScope.$broadcast('cacheUnhighlight', cache);
  }

  $scope.toggleCacheTiles = function(cache) {
    if (cache.showingTiles) {
      cache.showingTiles = false;
      $rootScope.$broadcast('hideCacheTiles', cache);
    } else {
      cache.showingTiles = true;
      $rootScope.$broadcast('showCacheTiles', cache);
    }
  }

  $rootScope.$on('cacheFootprintPopupOpen', function(event, cache) {
    $scope.cacheFilter = cache.name;
  });

  $rootScope.$on('cacheFootprintPopupClose', function(event, cache) {
    $scope.cacheFilter = null;
  });

  $scope.$watch('cacheFilter', function(filter) {
    $rootScope.$broadcast('cacheFilterChange', filter);
  });

};

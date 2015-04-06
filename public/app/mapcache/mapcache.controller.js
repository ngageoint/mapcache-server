angular
  .module('mapcache')
  .controller('MapcacheController', MapcacheController);

MapcacheController.$inject = [
  '$scope',
  '$rootScope',
  '$compile',
  '$timeout',
  '$location',
  'LocalStorageService',
  'CacheService'
];

function MapcacheController($scope, $rootScope, $compile, $timeout, $location, LocalStorageService, CacheService) {

  $scope.token = LocalStorageService.getToken();

  CacheService.getAllCaches().success(function(caches) {
    $scope.caches = caches;
  });

  $scope.createCache = function() {
    $location.path('/create');
  }

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

  $scope.cacheSize = function(cache) {
    var bytes = 0;
    for (var zoomLevel in cache.status.zoomLevelStatus) {
      bytes += cache.status.zoomLevelStatus[zoomLevel].size;
    }
		if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
		var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
			number = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / Math.pow(1024, Math.floor(number))).toFixed(3) +  ' ' + units[number];
  }

  $rootScope.$on('cacheFootprintPopupOpen', function(event, cache) {
    $scope.mapFilter = cache.id;
  });

  $rootScope.$on('cacheFootprintPopupClose', function(event, cache) {
    $scope.mapFilter = null;
  });

  $scope.$watch('cacheFilter+mapFilter', function(filter) {
    $rootScope.$broadcast('cacheFilterChange', {cacheFilter: $scope.cacheFilter, mapFilter: $scope.mapFilter});
  });

};

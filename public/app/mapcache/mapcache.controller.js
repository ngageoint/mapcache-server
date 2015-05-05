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

  function getCaches() {
    console.log("pull the caches");
    CacheService.getAllCaches(true).success(function(caches) {
      $scope.caches = caches;
      var currentlyGenerating = false;
      for (var i = 0; i < caches.length && !currentlyGenerating; i++) {
        var cache = caches[i];
        if (!cache.status.complete) {
          currentlyGenerating = true;
        }
      }
      console.log("is a cache generating?", currentlyGenerating);
      var delay = currentlyGenerating ? 30000 : 300000;
      $timeout(getCaches, delay);
    });
  }

  getCaches();

  $scope.createCache = function() {
    $location.path('/create');
  }

  $scope.downloadMissingTiles = function(cache) {
    CacheService.downloadMissing(cache).success(function(caches) {
      $scope.caches = caches;
      var currentlyGenerating = false;
      for (var i = 0; i < caches.length && !currentlyGenerating; i++) {
        var cache = caches[i];
        if (!cache.status.complete) {
          currentlyGenerating = true;
        }
      }
      console.log("is a cache generating?", currentlyGenerating);
      var delay = currentlyGenerating ? 30000 : 300000;
      $timeout(getCaches, delay);
    });
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
      if (cache.status.zoomLevelStatus[zoomLevel].size) {
        bytes += cache.status.zoomLevelStatus[zoomLevel].size;
      }
    }
		if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) return '-';
		var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
			number = Math.floor(Math.log(bytes) / Math.log(1024));
		return (bytes / Math.pow(1024, Math.floor(number))).toFixed(3) +  ' ' + units[number];
  }

  $scope.cacheFormatSize = function(cache, format) {
    var size = "Unknown";
    if (cache.formats && cache.formats[format]) {
      var bytes = cache.formats[format].size;
      var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
  			number = Math.floor(Math.log(bytes) / Math.log(1024));
  		return (bytes / Math.pow(1024, Math.floor(number))).toFixed(3) +  ' ' + units[number];
    }
    return size;
  }

  $scope.zoomSize = function(zoomStatus) {
    var bytes = zoomStatus.size;
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

  $scope.cacheBoundingBox = function(cache) {
    var extent = turf.extent(cache.geometry);
    return "West: " + extent[0] + " South: " + extent[1] + " East: " + extent[2]+ " North: " + extent[3];
  }

  $scope.cacheProgress = function(cache) {
    return Math.min(100,100*(cache.status.generatedTiles/cache.status.totalTiles));
  }
  $scope.zoomProgress = function(zoomStatus) {
    return Math.min(100,100*(zoomStatus.generatedTiles/zoomStatus.totalTiles));
  }
  $scope.sortedZooms = function(cache) {
    var zoomRows = [];
    for (var i = cache.minZoom; i <= cache.maxZoom; i=i+3) {
      var row = [];
      if (cache.status.zoomLevelStatus[i]) {
        row.push({zoom: i, status:cache.status.zoomLevelStatus[i]});
      }
      if (cache.status.zoomLevelStatus[i+1]) {
        row.push({zoom: i+1, status:cache.status.zoomLevelStatus[i+1]});
      }
      if (cache.status.zoomLevelStatus[i+2]) {
        row.push({zoom: i+2, status:cache.status.zoomLevelStatus[i+2]});
      }
      zoomRows.push(row);
    }
    return zoomRows;
  }

};

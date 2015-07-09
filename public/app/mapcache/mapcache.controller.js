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
  $scope.view = {showingTiles: {}, showingDetails: {}};

  function getCaches() {
    console.log("pull the caches");
    CacheService.getAllCaches(true).success(function(caches) {
      $scope.caches = caches;
      var currentlyGenerating = false;
      for (var i = 0; i < caches.length && !currentlyGenerating; i++) {
        var cache = caches[i];
        if (!cache.status.complete) {
          console.log('cache is generating', cache);
          currentlyGenerating = true;
        }
        for (var format in cache.formats) {
          if(cache.formats.hasOwnProperty(format)){
            if (cache.formats[format].generating) {
              console.log('cache format is generating ' + format, cache);
              currentlyGenerating = true;
            }
          }
        }
      }
      console.log("is a cache generating?", currentlyGenerating);
      var delay = currentlyGenerating ? 30000 : 300000;
      if ($location.path() == '/mapcache') {
        $timeout(getCaches, delay);
      }
    });
  }

  getCaches();

  $scope.createCache = function() {
    $location.path('/create');
  }

  Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
  };

  // Converts from radians to degrees.
  Math.degrees = function(radians) {
    return radians * 180 / Math.PI;
  };

  function getX(lon, zoom) {
  	var xtile = Math.floor((lon + 180) / 360 * (1 << zoom));
  	return xtile;
  }

  function getY(lat, zoom) {
  	var ytile = Math.floor((1 - Math.log(Math.tan(Math.radians(parseFloat(lat))) + 1 / Math.cos(Math.radians(parseFloat(lat)))) / Math.PI) /2 * (1 << zoom));
  	return ytile;
  }

  function xCalculator(bbox,z) {
  	var x = [];
  	var x1 = getX(Number(bbox[0]), z);
  	var x2 = getX(Number(bbox[2]), z);
  	x.max = Math.max(x1, x2);
  	x.min = Math.min(x1, x2);
  	if (z == 0){
  		x.current = Math.min(x1, x2);
  	}
  	return x;
  }

  function yCalculator(bbox,z) {
  	var y = [];
  	var y1 = getY(Number(bbox[1]), z);
  	var y2 = getY(Number(bbox[3]), z);
  	y.max = Math.max(y1, y2);
  	y.min = Math.min(y1, y2);
  	y.current = Math.min(y1, y2);
  	return y;
  }

  $scope.getOverviewTilePath = function(cache) {
    var extent = turf.extent(cache.geometry);
    if (!cache.maxZoom) {
      cache.maxZoom = 18;
    }
    if (!cache.minZoom) {
      cache.minZoom = 0;
    }
    //find the first zoom level with 1 tile
    var y = yCalculator(extent, cache.maxZoom);
    var x = xCalculator(extent, cache.maxZoom);
    var zoom = cache.maxZoom;
    var found = false;
    for (zoom; zoom >= cache.minZoom && !found; zoom--) {
      y = yCalculator(extent, zoom);
      x = xCalculator(extent, zoom);
      if (y.min == y.max && x.min == x.max) {
        found = true;
      }
    }
    zoom = zoom+1;
    return zoom+'/'+x.min+'/'+y.min+'.png';
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

  var cacheHighlightPromise;
  $scope.mouseOver = function(cache) {
    $rootScope.$broadcast('showCacheExtent', cache);
    if (cacheHighlightPromise) {
      $timeout.cancel(cacheHighlightPromise);
    }
    cacheHighlightPromise = $timeout(function() {
      $rootScope.$broadcast('showCache', cache);
    }, 500);
  }

  $scope.mouseOut = function(cache) {
    $rootScope.$broadcast('hideCacheExtent', cache);

    if (cacheHighlightPromise) {
      $timeout.cancel(cacheHighlightPromise);
      cacheHighlightPromise = undefined;
    }
    $rootScope.$broadcast('hideCache', cache);
  }

  $scope.toggleCacheTiles = function(cache) {
    if ($scope.view.showingTiles[cache.id]) {
      $scope.view.showingTiles[cache.id] = false;
      $rootScope.$broadcast('hideCacheTiles', cache);
    } else {
      $scope.view.showingTiles[cache.id] = true;
      $rootScope.$broadcast('showCacheTiles', cache);
    }
  }

  $scope.generateFormat = function(cache, format) {
    CacheService.createCacheFormat(cache, format, function() {
      cache.formats = cache.formats || {};
      cache.formats[format] = cache.formats[format] || {};
      cache.formats[format].generating = true;
      getCaches();
    });
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
    if (!cache.status.zoomLevelStatus) return zoomRows;
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

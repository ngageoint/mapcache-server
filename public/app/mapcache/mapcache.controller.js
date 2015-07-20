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
  'CacheService',
  'MapService',
  'TileUtilities'
];

function MapcacheController($scope, $rootScope, $compile, $timeout, $location, LocalStorageService, CacheService, MapService, TileUtilities) {
  $scope.tab = 'caches';
  $scope.token = LocalStorageService.getToken();
  $scope.view = {showingTiles: {}, showingDetails: {}};

  $scope.mapOptions = {
    opacity: 1
  };

  $rootScope.title = 'Welcome';

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

  MapService.getAllMaps(true).success(function(sources) {
    $scope.sources = sources;
  });

  $scope.createCache = function() {
    $location.path('/create');
  }

  $scope.getOverviewTilePath = TileUtilities.getOverviewTilePath;

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

  var sourceOverlay;
  var showSourcePromise;
  $scope.mouseOverSource = function(source) {
    if (showSourcePromise) {
      $timeout.cancel(showSourcePromise);
    }
    showSourcePromise = $timeout(function() {
      $rootScope.$broadcast('overlaySourceTiles', source);
    }, 500);
  }

  $scope.mouseOutSource = function(source) {
    $rootScope.$broadcast('removeSourceTiles', source);

    if (showSourcePromise) {
      $timeout.cancel(showSourcePromise);
      showSourcePromise = undefined;
    }
  }

  $scope.toggleSource = function(source) {
    if (sourceOverlay) {
      $scope.view.showingTiles[sourceOverlay.id] = false;
      $rootScope.$broadcast('removeSourceTiles', sourceOverlay);
    }
    if (!sourceOverlay || (source.id != sourceOverlay.id)) {
      $scope.view.showingTiles[source.id] = true;
      sourceOverlay = source;
      $rootScope.$broadcast('overlaySourceTiles', source);
    } else {
      sourceOverlay = null;
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

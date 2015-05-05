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
    opacity: .25
  };

  $scope.createAnotherCache = function() {
    $location.path('/create');
  }

  $scope.returnToList = function () {
    $location.path('/mapcache');
  };

  $scope.cacheProgress = function(cache) {
    if (cache)
      return Math.min(100,100*(cache.status.generatedTiles/cache.status.totalTiles));
  }
  $scope.zoomProgress = function(zoomStatus) {
    if (zoomStatus)
      return Math.min(100,100*(zoomStatus.generatedTiles/zoomStatus.totalTiles));
  }
  $scope.sortedZooms = function(cache) {
    console.log('zoom rows', cache);
    if (!cache) return;
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
    console.log('zoom rows', zoomRows);
    return zoomRows;
  }

  $scope.cacheBoundingBox = function(cache) {
    var extent = turf.extent(cache.geometry);
    return "West: " + extent[0] + " South: " + extent[1] + " East: " + extent[2]+ " North: " + extent[3];
  }

  function getCache(id) {
    var cache = $scope.cache || {};
    if (id) {
      cache.id = id;
    }
    CacheService.getCache(cache, function(cache) {
      // success
      $scope.cache = cache;
      $scope.zoomRows = $scope.sortedZooms(cache);
      if (!cache.status.complete) {
        $timeout(getCache, 1000);
      }
    }, function(data) {
      // error
    });
  }

  getCache($routeParams.cacheId);

};

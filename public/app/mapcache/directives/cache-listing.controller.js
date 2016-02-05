var turf = require('turf');
module.exports = function CacheListingController($scope, $rootScope, $timeout, LocalStorageService, $location, $routeParams) {

  $scope.token = LocalStorageService.getToken();
  $scope.options.opacity = $scope.options.opacity || 0.14;
  $scope.options.baseLayerUrl = $scope.options.baseLayerUrl || 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png';

  var cacheHighlightPromise;
  $scope.mouseOver = function(cache) {
    $rootScope.$broadcast('showCacheExtent', cache);
    if (cacheHighlightPromise) {
      $timeout.cancel(cacheHighlightPromise);
    }
    cacheHighlightPromise = $timeout(function() {
      $rootScope.$broadcast('showCache', cache);
    }, 500);
  };

  $scope.mouseOut = function(cache) {
    $rootScope.$broadcast('hideCacheExtent', cache);

    if (cacheHighlightPromise) {
      $timeout.cancel(cacheHighlightPromise);
      cacheHighlightPromise = undefined;
    }
    $rootScope.$broadcast('hideCache', cache);
  };

  $rootScope.$on('cacheFootprintPopupOpen', function(event, cache) {
    $scope.mapFilter = cache.id;
  });

  $rootScope.$on('cacheFootprintPopupClose', function() {
    $scope.mapFilter = null;
  });

  $scope.$watch('cacheFilter+mapFilter', function() {
    $scope.$emit('cacheFilterChange', {cacheFilter: $scope.cacheFilter, mapFilter: $scope.mapFilter});
  });

  $scope.featureProperties = [];

  $scope.createCacheFromMap = function() {
    $location.path('/create/'+$routeParams.mapId);
  };

  $scope.$watch('map.previewLayer', function(layer) {
    if (layer) {
      if (layer.EX_GeographicBoundingBox) { // jshint ignore:line
        $scope.mapOptions.extent = layer.EX_GeographicBoundingBox; // jshint ignore:line
      }
    }
  });

  $scope.generateFormat = function(cache, format) {
    $scope.$emit('generateFormat', cache, format);
  };

  $scope.createTiles = function(cache, minZoom, maxZoom) {
    cache.minZoom = minZoom;
    cache.maxZoom = maxZoom;
    $scope.$emit('generateFormat', cache, 'xyz');
  };

  $scope.calculateCacheSize = function(cache, minZoom, maxZoom) {
    if (!cache.source || ((isNaN(minZoom) || isNaN(maxZoom))) || !cache.geometry) return;
    cache.totalCacheSize = 0;
    cache.totalCacheTiles = 0;
    var extent = turf.extent(cache.geometry);
    for (var i = minZoom; i <= maxZoom; i++) {
      var xtiles = xCalculator(extent, i);
      var ytiles = yCalculator(extent, i);
      cache.totalCacheTiles += (1 + (ytiles.max - ytiles.min)) * (1 + (xtiles.max - xtiles.min));
    }
    cache.totalCacheSize = cache.totalCacheTiles * (cache.source.tileSize/cache.source.tileSizeCount);
  };

  Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
  };

  // Converts from radians to degrees.
  Math.degrees = function(radians) {
    return radians * 180 / Math.PI;
  };

  function xCalculator(bbox,z) {
    var x = [];
    var x1 = getX(Number(bbox[0]), z);
    var x2 = getX(Number(bbox[2]), z);
    x.max = Math.max(x1, x2);
    x.min = Math.min(x1, x2);
    if (z === 0){
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

  function getX(lon, zoom) {
    var xtile = Math.floor((lon + 180) / 360 * (1 << zoom));
    return xtile;
  }

  function getY(lat, zoom) {
    var ytile = Math.floor((1 - Math.log(Math.tan(Math.radians(parseFloat(lat))) + 1 / Math.cos(Math.radians(parseFloat(lat)))) / Math.PI) /2 * (1 << zoom));
    return ytile;
  }
};

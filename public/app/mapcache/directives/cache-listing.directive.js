angular
  .module('mapcache')
  .directive('cacheListing', cacheListing);

function cacheListing() {
  var directive = {
    restrict: "A",
    replace: true,
    templateUrl: 'app/mapcache/directives/cache-listing.html',
    scope: {
      map: '=',
      options: '=',
      caches: '='
    },
    controller: CacheListingController
  };

  return directive;
}

CacheListingController.$inject = ['$scope', '$rootScope', '$timeout', 'LocalStorageService'];

function CacheListingController($scope, $rootScope, $timeout, LocalStorageService) {

  $scope.token = LocalStorageService.getToken();
  $scope.options.opacity = $scope.options.opacity || .14;
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
  }

  $scope.mouseOut = function(cache) {
    $rootScope.$broadcast('hideCacheExtent', cache);

    if (cacheHighlightPromise) {
      $timeout.cancel(cacheHighlightPromise);
      cacheHighlightPromise = undefined;
    }
    $rootScope.$broadcast('hideCache', cache);
  }

  $rootScope.$on('cacheFootprintPopupOpen', function(event, cache) {
    $scope.mapFilter = cache.id;
  });

  $rootScope.$on('cacheFootprintPopupClose', function(event, cache) {
    $scope.mapFilter = null;
  });

  $scope.$watch('cacheFilter+mapFilter', function(filter) {
    $scope.$emit('cacheFilterChange', {cacheFilter: $scope.cacheFilter, mapFilter: $scope.mapFilter});
  });

  $scope.featureProperties = [];

  $scope.createCacheFromMap = function() {
    $location.path('/create/'+$routeParams.mapId);
  }

  $scope.$watch('map.previewLayer', function(layer, oldLayer) {
    if (layer) {
      if (layer.EX_GeographicBoundingBox) {
        $scope.mapOptions.extent = layer.EX_GeographicBoundingBox;
      }
    }
  });

  $scope.generateFormat = function(cache, format) {
    $scope.$emit('generateFormat', cache, format);
  }

  $scope.createTiles = function(cache, minZoom, maxZoom) {
    cache.minZoom = minZoom;
    cache.maxZoom = maxZoom;
    $scope.$emit('generateFormat', cache, 'xyz');
  }

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
  }

  Math.radians = function(degrees) {
    return degrees * Math.PI / 180;
  };

  // Converts from radians to degrees.
  Math.degrees = function(radians) {
    return radians * 180 / Math.PI;
  };

  function tile2lon(x,z) {
    return (x/Math.pow(2,z)*360-180);
  }

  function tile2lat(y,z) {
    var n=Math.PI-2*Math.PI*y/Math.pow(2,z);
    return (180/Math.PI*Math.atan(0.5*(Math.exp(n)-Math.exp(-n))));
  }

  function tileBboxCalculator(x, y, z) {
    console.log('tile box calculator for ' + x + ' ' + y + ' ' + z);
    x = Number(x);
    y = Number(y);
    var tileBounds = {
      north: tile2lat(y, z),
      east: tile2lon(x+1, z),
      south: tile2lat(y+1, z),
      west: tile2lon(x, z)
    };

    return tileBounds;
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

  function getX(lon, zoom) {
    var xtile = Math.floor((lon + 180) / 360 * (1 << zoom));
    return xtile;
  }

  function getY(lat, zoom) {
    var ytile = Math.floor((1 - Math.log(Math.tan(Math.radians(parseFloat(lat))) + 1 / Math.cos(Math.radians(parseFloat(lat)))) / Math.PI) /2 * (1 << zoom));
    return ytile;
  }
}

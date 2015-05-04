angular
  .module('mapcache')
  .controller('MapcacheCreateController', MapcacheCreateController);

MapcacheCreateController.$inject = [
  '$scope',
  '$location',
  '$http',
  '$routeParams',
  '$modal',
  'CacheService',
  'SourceService'
];

function MapcacheCreateController($scope, $location, $http, $routeParams, $modal, CacheService, SourceService) {

  $scope.currentAdminPanel = $routeParams.adminPanel || "user";

  var seenCorners;

  $http.get('/api/server')
  .success(function(data, status) {
    $scope.storage = data;
  }).error(function(data, status) {
    console.log("error pulling server data", status);
  });

  $scope.cache = {
    format: "xyz"
  };

  $scope.sizes = [{
    label: 'MB',
    multiplier: 1024*1024
  },{
    label: 'GB',
    multiplier: 1024*1024*1024
  }];

  $scope.cache.selectedSizeMultiplier = $scope.sizes[0];

  SourceService.getAllSources(true).success(function(sources) {
    $scope.sources = sources;
    if ($routeParams.sourceId) {
      for (var i = 0; i < $scope.sources.length && $scope.cache.source == null; i++) {
        if ($routeParams.sourceId == $scope.sources[i].id) {
          $scope.cache.source = $scope.sources[i];
        }
      }
    }
  });

  $scope.$watch('cache.geometry', function(geometry) {
    if (!geometry) {
      $scope.north = null;
      $scope.south = null;
      $scope.west = null;
      $scope.east = null;
      return;
    }

    var extent = turf.extent(geometry);
    $scope.north = extent[3];
    $scope.south = extent[1];
    $scope.west = extent[0];
    $scope.east = extent[2];

    calculateCacheSize();

  });

  $scope.$watch('cache.source', function(source) {
    if (!source.geometry) {
      $scope.north = null;
      $scope.south = null;
      $scope.west = null;
      $scope.east = null;
      $scope.cache.geometry = null;
      return;
    }
    if (source && source.format == 'geotiff') {
      var geometry = source.geometry;
      while(geometry.type != "Polygon" && geometry != null){
        geometry = geometry.geometry;
      }
      $scope.cache.geometry = geometry;
    }
  });

  $scope.$watch('cache.minZoom+cache.maxZoom', calculateCacheSize);

  $scope.requiredFieldsSet = function() {
    var zoomValidated = false;
    if (isNaN($scope.cache.minZoom) || isNaN($scope.cache.maxZoom) || $scope.cache.maxZoom === null || $scope.cache.minZoom === null) {
      zoomValidated = false;
    } else if ($scope.cache.minZoom === 0 && $scope.cache.maxZoom === 0) {
      zoomValidated = true;
    } else if ($scope.cache.minZoom === 0 && $scope.cache.maxZoom > 0) {
      zoomValidated = true;
    } else if ($scope.cache.maxZoom >= $scope.cache.minZoom) {
      zoomValidated = true;
    }
    return $scope.cache.geometry && $scope.cache.name && $scope.cache.source && zoomValidated;
  }

  $scope.createCache = function() {
    if ($scope.cache.rawTileSizeLimit) {
      $scope.cache.tileSizeLimit = $scope.cache.rawTileSizeLimit * $scope.cache.selectedSizeMultiplier.multiplier;
    }
    console.log($scope.cache);
    $scope.creatingCache = true;
    $scope.cacheCreationError = null;
    CacheService.createCache($scope.cache, function(cache) {
      $scope.creatingCache = false;
      $location.path('/cache/'+cache.id);
    }, function(error, status) {
      $scope.creatingCache = false;
      $scope.cacheCreationError = {error: error, status: status};
    });
  }

  $scope.createSource = function() {
    $location.path('/source');
  }

  function calculateCacheSize() {
    if (isNaN($scope.cache.minZoom) || isNaN($scope.cache.maxZoom) || !$scope.cache.geometry) return;
    $scope.totalCacheSize = 0;
    $scope.totalCacheTiles = 0;
    var extent = turf.extent($scope.cache.geometry);
    for (var i = $scope.cache.minZoom; i <= $scope.cache.maxZoom; i++) {
      var xtiles = xCalculator(extent, i);
      var ytiles = xCalculator(extent, i);
      $scope.totalCacheTiles += (((xtiles.max+1)-xtiles.min)*((ytiles.max+1)-ytiles.min));
    }
    $scope.totalCacheSize = $scope.totalCacheTiles * ($scope.cache.source.tileSize/$scope.cache.source.tileSizeCount);

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

};

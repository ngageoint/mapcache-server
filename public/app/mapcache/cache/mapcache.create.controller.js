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
  var boundsSet = false;

  $http.get('/api/server')
  .success(function(data, status) {
    $scope.storage = data;
  }).error(function(data, status) {
    console.log("error pulling server data", status);
  });

  $scope.bb = {};

  $scope.cache = {
    format: "xyz",
    create: {}
  };

  $scope.sizes = [{
    label: 'MB',
    multiplier: 1024*1024
  },{
    label: 'GB',
    multiplier: 1024*1024*1024
  }];

  $scope.cache.selectedSizeMultiplier = $scope.sizes[0];
  $scope.loadingSources = true;
  SourceService.getAllSources(true).success(function(sources) {
    $scope.loadingSources = false;
    $scope.sources = sources;
    if ($routeParams.sourceId) {
      for (var i = 0; i < $scope.sources.length && $scope.cache.source == null; i++) {
        if ($routeParams.sourceId == $scope.sources[i].id) {
          $scope.cache.source = $scope.sources[i];
        }
      }
    }
  }).error(function(error) {
    $scope.loadingSources = false;
  });

  $scope.useCurrentView = function() {
    $scope.cache.useCurrentView = Date.now();
  }

  // direction and value are working around something which is causing angular to fire this before the model changes
  $scope.manualEntry = function() {
    console.log('manual entry', $scope.bb);
    if (isNaN($scope.bb.north) || !$scope.bb.north
    || isNaN($scope.bb.south) || !$scope.bb.south
    || isNaN($scope.bb.west) || !$scope.bb.west
    || isNaN($scope.bb.east) || !$scope.bb.east) {
      boundsSet = false;
      $scope.$broadcast('extentChanged', null);
      return;
    }
    boundsSet = true;
    console.log("all directions are set");
    var envelope = {
      north: Number($scope.bb.north),
      south: Number($scope.bb.south),
      west: Number($scope.bb.west),
      east: Number($scope.bb.east)
    };

    $scope.$broadcast('extentChanged', envelope);
  }

  $scope.$watch('cache.geometry', function(geometry) {
    if (!geometry) {
      $scope.bb.north = null;
      $scope.bb.south = null;
      $scope.bb.west = null;
      $scope.bb.east = null;
      boundsSet = false;
      return;
    }
    boundsSet = true;
    var extent = turf.extent(geometry);
    $scope.bb.north = extent[3];
    $scope.bb.south = extent[1];
    $scope.bb.west = extent[0];
    $scope.bb.east = extent[2];

    calculateCacheSize();
  });

  $scope.$watch('cache.source', function(source) {
    $scope.cache.create = {};
    if ($scope.cache.source) {
      $scope.cache.style = $scope.cache.source.style;
      for (var i = 0; i < $scope.cache.source.cacheTypes.length; i++) {
        var type = $scope.cache.source.cacheTypes[i];
        $scope.cache.create[type.type] = type.required;
      }
      $scope.requiredFieldsSet();
    }

    if (!source || !source.geometry) {
      $scope.bb.north = null;
      $scope.bb.south = null;
      $scope.bb.west = null;
      $scope.bb.east = null;
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

  $scope.$watch('cache.source.previewLayer', function(layer, oldLayer) {
    if (layer) {
      if (layer.EX_GeographicBoundingBox) {
        $scope.cache.extent = layer.EX_GeographicBoundingBox;
      }
    }
  });

  $scope.$watch('cache.minZoom+cache.maxZoom', calculateCacheSize);

  $scope.requiredFieldsSet = function() {
    $scope.unsetFields = [];

    if (!$scope.cache.source) {
      $scope.unsetFields.push('cache source');
      return false;
    }

    if (!$scope.cache.name) {
      $scope.unsetFields.push('cache name');
    }

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

    var cacheTypeSet = false;
    console.log('scope.cache.create', $scope.cache.create);
    for (var type in $scope.cache.create) {
      if ($scope.cache.create[type] == true) {
        cacheTypeSet = true;
      }
    }

    if (!cacheTypeSet) {
      $scope.unsetFields.push('type of cache to create');
    }

    if (!zoomValidated) {
      $scope.unsetFields.push('zoom levels')
    }
    if (!boundsSet) {
      $scope.unsetFields.push('cache boundaries');
    }

    if ($scope.cache.source.format == 'wms' && !$scope.cache.source.previewLayer) {
      $scope.unsetFields.push('WMS layer');
      return false;
    }

    return $scope.cache.geometry && boundsSet && $scope.cache.name && $scope.cache.source && (zoomValidated || $scope.cache.source.vector);
  }

  $scope.createCache = function() {
    if ($scope.cache.rawTileSizeLimit) {
      $scope.cache.tileSizeLimit = $scope.cache.rawTileSizeLimit * $scope.cache.selectedSizeMultiplier.multiplier;
    }
    console.log($scope.cache);
    $scope.creatingCache = true;
    $scope.cacheCreationError = null;
    $scope.cache.cacheCreationParams = {};
    if ($scope.cache.source.previewLayer) {
      $scope.cache.cacheCreationParams.layer = $scope.cache.source.previewLayer.Name;
    };
    var create = [];
    for (var type in $scope.cache.create) {
      if ($scope.cache.create[type]) {
        create.push(type);
      }
    }
    $scope.cache.create = create;
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
    if (!$scope.cache.source || ((isNaN($scope.cache.minZoom) || isNaN($scope.cache.maxZoom)) && !$scope.cache.source.vector) || !$scope.cache.geometry) return;
    $scope.totalCacheSize = 0;
    $scope.totalCacheTiles = 0;
    var extent = turf.extent($scope.cache.geometry);
    for (var i = $scope.cache.minZoom; i <= $scope.cache.maxZoom; i++) {
      var xtiles = xCalculator(extent, i);
      var ytiles = yCalculator(extent, i);
      $scope.totalCacheTiles += (1 + (ytiles.max - ytiles.min)) * (1 + (xtiles.max - xtiles.min));
    }
    $scope.totalCacheSize = $scope.totalCacheTiles * ($scope.cache.source.tileSize/$scope.cache.source.tileSizeCount);
    $scope.cacheFeatures = 0;
    $scope.cache.source.totalFeatures = $scope.cache.source.data ? $scope.cache.source.data.features.length : 0;
    if ($scope.cache.source.vector) {
      var poly = turf.bboxPolygon(extent);
      for (var i = 0; i < $scope.cache.source.data.features.length; i++) {
        var feature = $scope.cache.source.data.features[i];
        var intersection = turf.intersect(poly, feature);
        if (intersection) {
          $scope.cacheFeatures++;
        }
      }
    }
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

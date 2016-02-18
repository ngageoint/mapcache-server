var angular = require('angular');
var turf = require('turf');
var _ = require('underscore');

var MapcacheCreateController = function($scope, $location, $http, $routeParams, $modal, $rootScope, ServerService, CacheService, MapService, LocalStorageService) {
  this.MapService = MapService;
  this.ServerService = ServerService;
  this.$location = $location;

  $scope.create = this;
  $scope.$watch('create.cache.geometry', this._cacheGeometryWatch.bind(this));
  $scope.$watch('create.cache.source', this._cacheSourceWatch.bind(this));
  $scope.$watch('create.cache.source.previewLayer', this._layerWatch.bind(this));
  $scope.$watch('create.cache.create', this._cacheCreateWatch.bind(this), true);
  $scope.$watch('create.cache.minZoom+create.cache.maxZoom+create.tileCacheRequested', this._calculateCacheSize.bind(this));

  $rootScope.title = 'Create A Cache';
  this.token = LocalStorageService.getToken();

  this.mapId = $routeParams.mapId;
  this.cache = {
    format: "xyz",
    create: {}
  };

  this.bb = {};
  var defaultStyle = {
    'fill': "#000000",
    'fill-opacity': 0.5,
    'stroke': "#0000FF",
    'stroke-opacity': 1.0,
    'stroke-width': 1
  };
  this.featureProperties = [];
  this.newRule = {
    style: angular.copy(defaultStyle)
  };

  this.sizes = [{
    label: 'MB',
    multiplier: 1024*1024
  },{
    label: 'GB',
    multiplier: 1024*1024*1024
  }];

  this.cache.selectedSizeMultiplier = this.sizes[0];
  this.loadingMaps = true;
  this.boundsSet = false;

  this.initialize();
};

MapcacheCreateController.prototype.initialize = function () {
  if (this.mapId) {
    this.MapService.getMap({id:this.mapId}, function(map) {
      console.log('this.mapid', map);
      this.cache.source = map;
      this.loadingMaps = false;
    }.bind(this));
  } else {
    this.MapService.getAllMaps(true).success(function(maps) {
      this.loadingMaps = false;
      this.maps = maps;
    }.bind(this)).error(function() {
      this.loadingMaps = false;
    }.bind(this));
  }
  this.ServerService.getMaxCacheSize(function(data) {
    this.storage = data;
  }.bind(this));
};

MapcacheCreateController.prototype.useCurrentView = function() {
  this.cache.useCurrentView = Date.now();
};

MapcacheCreateController.prototype.dmsChange = function(direction, dms) {
  this.bb[direction] = (!isNaN(dms.degrees) ? Number(dms.degrees) : 0) + (!isNaN(dms.minutes) ? dms.minutes/60 : 0) + (!isNaN(dms.seconds) ? dms.seconds/(60*60) : 0);
  this.manualEntry();
};

MapcacheCreateController.prototype.manualEntry = function() {
  console.log('manual entry', this.bb);
  this._setDirectionDMS(this.bb.north, this.north);
  this._setDirectionDMS(this.bb.south, this.south);
  this._setDirectionDMS(this.bb.east, this.east);
  this._setDirectionDMS(this.bb.west, this.west);
  if (isNaN(this.bb.north) || !this.bb.north || this.bb.north.toString().endsWith('.') ||
  isNaN(this.bb.south) || !this.bb.south || this.bb.south.toString().endsWith('.') ||
  isNaN(this.bb.west) || !this.bb.west || this.bb.west.toString().endsWith('.') ||
  isNaN(this.bb.east) || !this.bb.east || this.bb.east.toString().endsWith('.')) {
    this.boundsSet = false;
    this.$broadcast('extentChanged', null);
    return true;
  }
  this.boundsSet = true;
  console.log("all directions are set");
  var envelope = {
    north: Number(this.bb.north),
    south: Number(this.bb.south),
    west: Number(this.bb.west),
    east: Number(this.bb.east)
  };

  this.$broadcast('extentChanged', envelope);
};

MapcacheCreateController.prototype._setDirectionDMS = function(deg, direction) {
  if (!deg) return;
   var d = Math.floor (deg);
   var minfloat = (deg-d)*60;
   var m = Math.floor(minfloat);
   var secfloat = (minfloat-m)*60;
   var s = Math.round(secfloat);
   direction.degrees = d;
   direction.minutes = m;
   direction.seconds = s;
};

MapcacheCreateController.prototype.toggleDataSource = function(id, ds) {
  if (this.selectedDatasources[id]) {
    this.cache.currentDatasources.push(ds);
  } else {
    this.cache.currentDatasources = _.without(this.cache.currentDatasources, ds);
  }
};

MapcacheCreateController.prototype.requiredFieldsSet = function() {
  this.unsetFields = [];

  if (!this.cache.source) {
    this.unsetFields.push('cache map');
    return false;
  }

  if (!this.cache.name) {
    this.unsetFields.push('cache name');
  }

  var zoomValidated = false;
  if (!this.tileCacheRequested) {
    zoomValidated = true;
  } else {
    if (isNaN(this.cache.minZoom) || isNaN(this.cache.maxZoom) || this.cache.maxZoom === null || this.cache.minZoom === null) {
      zoomValidated = false;
    } else if (this.cache.minZoom === 0 && this.cache.maxZoom === 0) {
      zoomValidated = true;
    } else if (this.cache.minZoom === 0 && this.cache.maxZoom > 0) {
      zoomValidated = true;
    } else if (this.cache.maxZoom >= this.cache.minZoom) {
      zoomValidated = true;
    }
  }

  var cacheTypeSet = false;
  for (var type in this.cache.create) {
    if (this.cache.create[type] === true) {
      cacheTypeSet = true;
    }
  }

  if (!cacheTypeSet) {
    this.unsetFields.push('type of cache to create');
  }

  if (!zoomValidated) {
    this.unsetFields.push('zoom levels');
  }
  if (!this.boundsSet) {
    this.unsetFields.push('cache boundaries');
  }

  if (!_.some(_.values(this.currentDatasources), function(value) {
    return value;
  })) {
    this.unsetFields.push('at least one data source');
  }

  if (this.cache.source.format === 'wms' && !this.cache.source.previewLayer) {
    this.unsetFields.push('WMS layer');
    return false;
  }

  return this.cache.geometry && this.boundsSet && this.cache.name && this.cache.source && zoomValidated;
};

MapcacheCreateController.prototype.createCache = function() {
  if (this.cache.rawTileSizeLimit) {
    this.cache.tileSizeLimit = this.cache.rawTileSizeLimit * this.cache.selectedSizeMultiplier.multiplier;
  }
  console.log(this.cache);
  this.creatingCache = true;
  this.cacheCreationError = null;
  this.cache.cacheCreationParams = {
    dataSources: []
  };
  _.each(this.cache.currentDatasources, function(ds) {
    this.cache.cacheCreationParams.dataSources.push(ds._id);
  });
  var create = [];
  for (var type in this.cache.create) {
    if (this.cache.create[type]) {
      create.push(type);
    }
  }
  this.cache.create = create;
  this.CacheService.createCache(this.cache, function(cache) {
    this.creatingCache = false;
    this.$location.path('/cache/'+cache.id);
  }, function(error, status) {
    this.creatingCache = false;
    this.cacheCreationError = {error: error, status: status};
  });
};

MapcacheCreateController.prototype.createMap = function() {
  this.$location.path('/map');
};

MapcacheCreateController.prototype._calculateCacheSize = function() {
  if (!this.tileCacheRequested || !this.cache.source || ((isNaN(this.cache.minZoom) || isNaN(this.cache.maxZoom)) && !this.cache.source.vector) || !this.cache.geometry) {
    this.totalCacheSize = 0;
    this.totalCacheTiles = 0;
    return;
  }
  this.totalCacheSize = 0;
  this.totalCacheTiles = 0;
  var extent = turf.extent(this.cache.geometry);
  for (var zoom = this.cache.minZoom; zoom <= this.cache.maxZoom; zoom++) {
    var xtiles = xCalculator(extent, zoom);
    var ytiles = yCalculator(extent, zoom);
    this.totalCacheTiles += (1 + (ytiles.max - ytiles.min)) * (1 + (xtiles.max - xtiles.min));
  }
  console.log('tilesize', this.cache.source.tileSize);
  console.log('tilesizecount', this.cache.source.tileSizeCount);
  console.log('totalCacheTiles', this.totalCacheTiles);
  this.totalCacheSize = this.totalCacheTiles * (this.cache.source.tileSize/this.cache.source.tileSizeCount);
  this.cacheFeatures = 0;
  this.cache.source.totalFeatures = this.cache.source.data ? this.cache.source.data.features.length : 0;
  if (this.cache.source.vector) {
    var poly = turf.bboxPolygon(extent);
    for (var i = 0; i < this.cache.source.data.features.length; i++) {
      var feature = this.cache.source.data.features[i];
      var intersection = turf.intersect(poly, feature);
      if (intersection) {
        this.cacheFeatures++;
      }
    }
  }
};

MapcacheCreateController.prototype._cacheGeometryWatch = function(geometry) {
  if (!geometry) {
    this.bb.north = null;
    this.bb.south = null;
    this.bb.west = null;
    this.bb.east = null;
    this.north = {};
    this.south = {};
    this.west = {};
    this.east = {};
    this.boundsSet = false;
    return;
  }
  this.boundsSet = true;
  var extent = turf.extent(geometry);
  this.bb.north = extent[3];
  this._setDirectionDMS(this.bb.north, this.north);
  this.bb.south = extent[1];
  this._setDirectionDMS(this.bb.south, this.south);
  this.bb.west = extent[0];
  this._setDirectionDMS(this.bb.west, this.west);
  this.bb.east = extent[2];
  this._setDirectionDMS(this.bb.east, this.east);

  this._calculateCacheSize();
};

MapcacheCreateController.prototype._cacheSourceWatch = function(map) {
  if (!map) return;
  this.selectedDatasources = {};
  this.cache.currentDatasources = map.dataSources;
  _.each(map.dataSources, function(ds) {
    this.selectedDatasources[ds._id] = true;
  }.bind(this));
  this.cache.create = {};
  if (this.cache.source) {
    this.cache.style = this.cache.source.style;
    for (var i = 0; i < this.cache.source.cacheTypes.length; i++) {
      var type = this.cache.source.cacheTypes[i];
      this.cache.create[type.type] = type.required;
    }
    this.requiredFieldsSet();
  }

  if (!map || !map.geometry) {
    this.bb.north = null;
    this.bb.south = null;
    this.bb.west = null;
    this.bb.east = null;
    this.cache.geometry = null;
  }

  this.hasVectorSources = _.some(map.dataSources, function(ds) {
    return ds.vector;
  });
};

MapcacheCreateController.prototype._cacheCreateWatch = function() {
  if (!this.cache.create) return;
  var tileCacheRequested = false;
  for (var key in this.cache.create) {
    if (this.cache.create[key] === true) {
      for (var i = 0; i < this.cache.source.cacheTypes.length && !tileCacheRequested; i++) {
        if (this.cache.source.cacheTypes[i].type === key && !this.cache.source.cacheTypes[i].vector) {
          tileCacheRequested = true;
        }
      }
    }
  }
  this.tileCacheRequested = tileCacheRequested;
};

MapcacheCreateController.prototype._layerWatch = function(layer) {
  if (layer) {
    if (layer.EX_GeographicBoundingBox) { // jshint ignore:line
      this.cache.extent = layer.EX_GeographicBoundingBox; // jshint ignore:line
    }
  }
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

module.exports = MapcacheCreateController;

// module.exports = function MapcacheCreateController($scope, $location, $http, $routeParams, $modal, $rootScope, ServerService, CacheService, MapService, LocalStorageService) {
//
//   $rootScope.title = 'Create A Cache';
//   $scope.token = LocalStorageService.getToken();
//
//   $scope.mapId = $routeParams.mapId;
//
//   var boundsSet = false;
//
//   var defaultStyle = {
//     'fill': "#000000",
//     'fill-opacity': 0.5,
//     'stroke': "#0000FF",
//     'stroke-opacity': 1.0,
//     'stroke-width': 1
//   };
//   $scope.featureProperties = [];
//   $scope.newRule = {
//     style: angular.copy(defaultStyle)
//   };
//
//   ServerService.getMaxCacheSize(function(data) {
//     $scope.storage = data;
//   });
//
//   $scope.bb = {};
//
//   $scope.cache = {
//     format: "xyz",
//     create: {}
//   };
//
//   $scope.sizes = [{
//     label: 'MB',
//     multiplier: 1024*1024
//   },{
//     label: 'GB',
//     multiplier: 1024*1024*1024
//   }];
//
//   $scope.cache.selectedSizeMultiplier = $scope.sizes[0];
//   $scope.loadingMaps = true;
//
//   if ($scope.mapId) {
//     MapService.getMap({id:$scope.mapId}, function(map) {
//       $scope.cache.source = map;
//       $scope.loadingMaps = false;
//     });
//   } else {
//     MapService.getAllMaps(true).success(function(maps) {
//       $scope.loadingMaps = false;
//       $scope.maps = maps;
//     }).error(function() {
//       $scope.loadingMaps = false;
//     });
//   }
//
//   $scope.useCurrentView = function() {
//     $scope.cache.useCurrentView = Date.now();
//   };
//
//   $scope.dmsChange = function(direction, dms) {
//     $scope.bb[direction] = (!isNaN(dms.degrees) ? Number(dms.degrees) : 0) + (!isNaN(dms.minutes) ? dms.minutes/60 : 0) + (!isNaN(dms.seconds) ? dms.seconds/(60*60) : 0);
//     $scope.manualEntry();
//   };
//
//   $scope.manualEntry = function() {
//     console.log('manual entry', $scope.bb);
//     setDirectionDMS($scope.bb.north, $scope.north);
//     setDirectionDMS($scope.bb.south, $scope.south);
//     setDirectionDMS($scope.bb.east, $scope.east);
//     setDirectionDMS($scope.bb.west, $scope.west);
//     if (isNaN($scope.bb.north) || !$scope.bb.north || $scope.bb.north.toString().endsWith('.') ||
//     isNaN($scope.bb.south) || !$scope.bb.south || $scope.bb.south.toString().endsWith('.') ||
//     isNaN($scope.bb.west) || !$scope.bb.west || $scope.bb.west.toString().endsWith('.') ||
//     isNaN($scope.bb.east) || !$scope.bb.east || $scope.bb.east.toString().endsWith('.')) {
//       boundsSet = false;
//       $scope.$broadcast('extentChanged', null);
//       return true;
//     }
//     boundsSet = true;
//     console.log("all directions are set");
//     var envelope = {
//       north: Number($scope.bb.north),
//       south: Number($scope.bb.south),
//       west: Number($scope.bb.west),
//       east: Number($scope.bb.east)
//     };
//
//     $scope.$broadcast('extentChanged', envelope);
//   };
//
//   function setDirectionDMS (deg, direction) {
//     if (!deg) return;
//      var d = Math.floor (deg);
//      var minfloat = (deg-d)*60;
//      var m = Math.floor(minfloat);
//      var secfloat = (minfloat-m)*60;
//      var s = Math.round(secfloat);
//      direction.degrees = d;
//      direction.minutes = m;
//      direction.seconds = s;
// }
//
//   $scope.$watch('cache.geometry', function(geometry) {
//     if (!geometry) {
//       $scope.bb.north = null;
//       $scope.bb.south = null;
//       $scope.bb.west = null;
//       $scope.bb.east = null;
//       $scope.north = {};
//       $scope.south = {};
//       $scope.west = {};
//       $scope.east = {};
//       boundsSet = false;
//       return;
//     }
//     boundsSet = true;
//     var extent = turf.extent(geometry);
//     $scope.bb.north = extent[3];
//     setDirectionDMS($scope.bb.north, $scope.north);
//     $scope.bb.south = extent[1];
//     setDirectionDMS($scope.bb.south, $scope.south);
//     $scope.bb.west = extent[0];
//     setDirectionDMS($scope.bb.west, $scope.west);
//     $scope.bb.east = extent[2];
//     setDirectionDMS($scope.bb.east, $scope.east);
//
//     calculateCacheSize();
//   });
//
//   $scope.toggleDataSource = function(id, ds) {
//     if ($scope.selectedDatasources[id]) {
//       $scope.cache.currentDatasources.push(ds);
//     } else {
//       $scope.cache.currentDatasources = _.without($scope.cache.currentDatasources, ds);
//     }
//   };
//
//   $scope.$watch('cache.source', function(map) {
//     if (!map) return;
//     $scope.selectedDatasources = {};
//     $scope.cache.currentDatasources = map.dataSources;
//     _.each(map.dataSources, function(ds) {
//       $scope.selectedDatasources[ds._id] = true;
//     });
//     $scope.cache.create = {};
//     if ($scope.cache.source) {
//       $scope.cache.style = $scope.cache.source.style;
//       for (var i = 0; i < $scope.cache.source.cacheTypes.length; i++) {
//         var type = $scope.cache.source.cacheTypes[i];
//         $scope.cache.create[type.type] = type.required;
//       }
//       $scope.requiredFieldsSet();
//     }
//
//     if (!map || !map.geometry) {
//       $scope.bb.north = null;
//       $scope.bb.south = null;
//       $scope.bb.west = null;
//       $scope.bb.east = null;
//       $scope.cache.geometry = null;
//     }
//
//     $scope.hasVectorSources = _.some(map.dataSources, function(ds) {
//       return ds.vector;
//     });
//   });
//
//   $scope.$watch('cache.source.previewLayer', function(layer) {
//     if (layer) {
//       if (layer.EX_GeographicBoundingBox) { // jshint ignore:line
//         $scope.cache.extent = layer.EX_GeographicBoundingBox; // jshint ignore:line
//       }
//     }
//   });
//
//   $scope.$watch('cache.create', function() {
//     if (!$scope.cache.create) return;
//     var tileCacheRequested = false;
//     for (var key in $scope.cache.create) {
//       if ($scope.cache.create[key] === true) {
//         console.log('create', key);
//         for (var i = 0; i < $scope.cache.source.cacheTypes.length && !tileCacheRequested; i++) {
//           if ($scope.cache.source.cacheTypes[i].type === key && !$scope.cache.source.cacheTypes[i].vector) {
//             tileCacheRequested = true;
//           }
//         }
//       }
//     }
//     console.log('tile cache requested', tileCacheRequested);
//     $scope.tileCacheRequested = tileCacheRequested;
//   }, true);
//
//   $scope.$watch('cache.minZoom+cache.maxZoom+tileCacheRequested', calculateCacheSize);
//
//   $scope.requiredFieldsSet = function() {
//     $scope.unsetFields = [];
//
//     if (!$scope.cache.source) {
//       $scope.unsetFields.push('cache map');
//       return false;
//     }
//
//     if (!$scope.cache.name) {
//       $scope.unsetFields.push('cache name');
//     }
//
//     var zoomValidated = false;
//     if (!$scope.tileCacheRequested) {
//       zoomValidated = true;
//     } else {
//       if (isNaN($scope.cache.minZoom) || isNaN($scope.cache.maxZoom) || $scope.cache.maxZoom === null || $scope.cache.minZoom === null) {
//         zoomValidated = false;
//       } else if ($scope.cache.minZoom === 0 && $scope.cache.maxZoom === 0) {
//         zoomValidated = true;
//       } else if ($scope.cache.minZoom === 0 && $scope.cache.maxZoom > 0) {
//         zoomValidated = true;
//       } else if ($scope.cache.maxZoom >= $scope.cache.minZoom) {
//         zoomValidated = true;
//       }
//     }
//
//     var cacheTypeSet = false;
//     console.log('scope.cache.create', $scope.cache.create);
//     for (var type in $scope.cache.create) {
//       if ($scope.cache.create[type] === true) {
//         cacheTypeSet = true;
//       }
//     }
//
//     if (!cacheTypeSet) {
//       $scope.unsetFields.push('type of cache to create');
//     }
//
//     if (!zoomValidated) {
//       $scope.unsetFields.push('zoom levels');
//     }
//     if (!boundsSet) {
//       $scope.unsetFields.push('cache boundaries');
//     }
//
//     if (!_.some(_.values($scope.currentDatasources), function(value) {
//       return value;
//     })) {
//       $scope.unsetFields.push('at least one data source');
//     }
//
//     if ($scope.cache.source.format === 'wms' && !$scope.cache.source.previewLayer) {
//       $scope.unsetFields.push('WMS layer');
//       return false;
//     }
//
//     return $scope.cache.geometry && boundsSet && $scope.cache.name && $scope.cache.source && zoomValidated;
//   };
//
//   $scope.createCache = function() {
//     if ($scope.cache.rawTileSizeLimit) {
//       $scope.cache.tileSizeLimit = $scope.cache.rawTileSizeLimit * $scope.cache.selectedSizeMultiplier.multiplier;
//     }
//     console.log($scope.cache);
//     $scope.creatingCache = true;
//     $scope.cacheCreationError = null;
//     $scope.cache.cacheCreationParams = {
//       dataSources: []
//     };
//     _.each($scope.cache.currentDatasources, function(ds) {
//       $scope.cache.cacheCreationParams.dataSources.push(ds._id);
//     });
//     var create = [];
//     for (var type in $scope.cache.create) {
//       if ($scope.cache.create[type]) {
//         create.push(type);
//       }
//     }
//     $scope.cache.create = create;
//     CacheService.createCache($scope.cache, function(cache) {
//       $scope.creatingCache = false;
//       $location.path('/cache/'+cache.id);
//     }, function(error, status) {
//       $scope.creatingCache = false;
//       $scope.cacheCreationError = {error: error, status: status};
//     });
//   };
//
//   $scope.createMap = function() {
//     $location.path('/map');
//   };
//
//   function calculateCacheSize() {
//     if (!$scope.tileCacheRequested || !$scope.cache.source || ((isNaN($scope.cache.minZoom) || isNaN($scope.cache.maxZoom)) && !$scope.cache.source.vector) || !$scope.cache.geometry) {
//       $scope.totalCacheSize = 0;
//       $scope.totalCacheTiles = 0;
//       return;
//     }
//     $scope.totalCacheSize = 0;
//     $scope.totalCacheTiles = 0;
//     var extent = turf.extent($scope.cache.geometry);
//     for (var zoom = $scope.cache.minZoom; zoom <= $scope.cache.maxZoom; zoom++) {
//       var xtiles = xCalculator(extent, zoom);
//       var ytiles = yCalculator(extent, zoom);
//       $scope.totalCacheTiles += (1 + (ytiles.max - ytiles.min)) * (1 + (xtiles.max - xtiles.min));
//     }
//     $scope.totalCacheSize = $scope.totalCacheTiles * ($scope.cache.source.tileSize/$scope.cache.source.tileSizeCount);
//     $scope.cacheFeatures = 0;
//     $scope.cache.source.totalFeatures = $scope.cache.source.data ? $scope.cache.source.data.features.length : 0;
//     if ($scope.cache.source.vector) {
//       var poly = turf.bboxPolygon(extent);
//       for (var i = 0; i < $scope.cache.source.data.features.length; i++) {
//         var feature = $scope.cache.source.data.features[i];
//         var intersection = turf.intersect(poly, feature);
//         if (intersection) {
//           $scope.cacheFeatures++;
//         }
//       }
//     }
//   }
//
//   Math.radians = function(degrees) {
//     return degrees * Math.PI / 180;
//   };
//
//   // Converts from radians to degrees.
//   Math.degrees = function(radians) {
//     return radians * 180 / Math.PI;
//   };
//
//    function xCalculator(bbox,z) {
//   	var x = [];
//   	var x1 = getX(Number(bbox[0]), z);
//   	var x2 = getX(Number(bbox[2]), z);
//   	x.max = Math.max(x1, x2);
//   	x.min = Math.min(x1, x2);
//   	if (z === 0){
//   		x.current = Math.min(x1, x2);
//   	}
//   	return x;
//   }
//
//   function yCalculator(bbox,z) {
//   	var y = [];
//   	var y1 = getY(Number(bbox[1]), z);
//   	var y2 = getY(Number(bbox[3]), z);
//   	y.max = Math.max(y1, y2);
//   	y.min = Math.min(y1, y2);
//   	y.current = Math.min(y1, y2);
//   	return y;
//   }
//
//   function getX(lon, zoom) {
//   	var xtile = Math.floor((lon + 180) / 360 * (1 << zoom));
//   	return xtile;
//   }
//
//   function getY(lat, zoom) {
//   	var ytile = Math.floor((1 - Math.log(Math.tan(Math.radians(parseFloat(lat))) + 1 / Math.cos(Math.radians(parseFloat(lat)))) / Math.PI) /2 * (1 << zoom));
//   	return ytile;
//   }
//
// };

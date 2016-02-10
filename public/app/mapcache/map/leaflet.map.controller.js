var L = require('leaflet');
require('drmonty-leaflet-awesome-markers');
require('leaflet-groupedlayercontrol');
require('../../leaflet-extensions');
require('../leaflet');
var turf = require('turf');
var _ = require('underscore');

module.exports = function LeafletMapController($scope, $element, $rootScope, LocalStorageService, MapService, LeafletUtilities) {
  var layers = {};
  var cacheCenters = [];

  var cacheMarker = L.AwesomeMarkers.icon({
    icon: 'globe',
    prefix: 'fa',
    markerColor: 'darkblue',
    iconColor: '#FCFCFC'
  });

  var grayCacheMarker = L.AwesomeMarkers.icon({
    icon: 'globe',
    prefix: 'fa',
    markerColor: 'lightgray',
    iconColor: '#FCFCFC'
  });

  var mapLayerOptions = {
    maxZoom: 18,
    tms: false,
    opacity: 1
  };

  var mapLayer = null;
  var baseLayer = null;
  var defaultLayer = null;

  var mapOptions = $scope.options && $scope.options.mapOptions ? $scope.options.mapOptions : {};
  mapOptions.center = mapOptions.center || [45,-100];
  mapOptions.zoom = mapOptions.zoom || 4;
  mapOptions.minZoom = mapOptions.minZoom || 0;
  mapOptions.maxZoom = mapOptions.maxZoom || 18;

  var map = L.map($element[0], mapOptions);
  if ($scope.options && !$scope.options.hideZoomIndicator) {
    map.addControl(new L.Control.ZoomIndicator());
  }

  var mapTilesLoaded = {};
  var canvasTiles = L.tileLayer.canvas();

  canvasTiles.drawTile = function(canvas, tilePoint, zoom) {
		var limit = this._getWrapTileNum();

		tilePoint.x = ((tilePoint.x % limit.x) + limit.x) % limit.x;

    var ctx = canvas.getContext('2d');
    if (mapTilesLoaded[zoom+'-'+tilePoint.x+'-'+tilePoint.y]) {
      ctx.fillStyle = "rgba(128, 128, 128, 0)";
    } else {
      ctx.fillStyle="rgba(128, 128, 128, .5)";
    }
    ctx.fillRect(0, 0, 256, 256);
  };

  map.on('click', function(event) {
    if (!$scope.map.style) return;
    if ($scope.map.style.title || $scope.map.style.description) {

      var pixelPoint = event.layerPoint;
      pixelPoint.y = pixelPoint.y + 5;
      pixelPoint.x = pixelPoint.x - 5;
      var latLngCorner = map.layerPointToLatLng(pixelPoint);
      var latLngDelta = {
        lng: event.latlng.lng - latLngCorner.lng,
        lat: event.latlng.lat - latLngCorner.lat
      };

      MapService.getFeatures($scope.map, event.latlng.lng - latLngDelta.lng, event.latlng.lat - latLngDelta.lat, event.latlng.lng + latLngDelta.lng, event.latlng.lat + latLngDelta.lat, map.getZoom(), function(features) {
        if (!features) return;

        var title = "";
        if ($scope.map.style.title && features[0].properties && features[0].properties[$scope.map.style.title]) {
          title = features[0].properties[$scope.map.style.title];
        }
        var description = "";
        if ($scope.map.style.description && features[0].properties && features[0].properties[$scope.map.style.description]) {
          description = features[0].properties[$scope.map.style.description];
        }
        var popupContent = title + " " + description;

        L.popup()
          .setLatLng(event.latlng)
          .setContent(popupContent)
          .openOn(map);
      });
    }
  });

  var cacheFootprints = {};

  var oldCenter, oldZoom, highlightedCache;
  var centered = false;

  $scope.$watch('caches', function(caches) {
    if (!caches) return;
    cacheCenters = [];

    for (var i = 0; i < caches.length; i++) {
      var cache = caches[i];
      if (!cacheFootprints[cache.id]) {
        createRectangle(cache);
      }
    }

    if (!centered) {
      if (cacheCenters && cacheCenters.length > 0) {
        var fc = turf.featurecollection(cacheCenters);
        var extent = turf.extent(turf.featurecollection(cacheCenters));
        map.fitBounds([
          [extent[1],extent[0]],
          [extent[3], extent[2]]
        ], {animate: false});
      }
      centered = true;
    }
  });

  $rootScope.$on('showCache', function(event, cache) {
    hideCache(highlightedCache, false);
    showCache(cache);
  });

  $rootScope.$on('hideCache', function(event, cache) {
    hideCache(cache, true);
  });

  $rootScope.$on('showCacheExtent', function(event, cache) {
    showCacheExtent(cache);
  });

  $rootScope.$on('hideCacheExtent', function(event, cache) {
    hideCacheExtent(cache);
  });

  var popupOpenId;

  function hideCacheExtent(cache) {
    if (!popupOpenId) {
      createRectangle(cache);
    }
    for (var cacheId in cacheFootprints) {
      if (!popupOpenId) {
        cacheFootprints[cacheId].center.setIcon(cacheMarker);
      }
    }
  }

  function showCacheExtent(cache) {
    createRectangle(cache, "#0066A2");
    for (var cacheId in cacheFootprints) {
      if (cacheId !== cache.id && popupOpenId !== cacheId) {
        cacheFootprints[cacheId].center.setIcon(grayCacheMarker);
      }
    }
  }

  function showCache(cache) {
    if (!highlightedCache) {
      oldCenter = map.getCenter();
      oldZoom = map.getZoom();
    }
    highlightedCache = cache;

    var extent = turf.extent(cache.geometry);
    map.fitBounds([
      [extent[1],extent[0]],
      [extent[3], extent[2]]
    ], {animate: false});
    showCacheTiles(cache);
  }

  function hideCache(cache, moveMap) {
    if (highlightedCache && highlightedCache.id === cache.id) {
      if (moveMap) {
        map.setView(oldCenter, oldZoom);
      }
      oldCenter = undefined;
      oldZoom = undefined;
      removeCacheTiles(cache);
      highlightedCache = undefined;
    }
  }

  $rootScope.$on('showCacheTiles', function(event, cache) {
    showCacheTiles(cache);
  });

  $rootScope.$on('hideCacheTiles', function(event, cache) {
    removeCacheTiles(cache);
  });

  function createRectangle(cache, color) {
    var rectangle = cacheFootprints[cache.id];
    if (rectangle) {
      var rectangleStyle = {
        fillColor: color,
      };
      if (color) {
        rectangleStyle.color = color;
        rectangleStyle.opacity = 1;
      } else {
        rectangleStyle.color = '#333333';
        rectangleStyle.opacity = 0;
      }
      rectangle.footprint.setStyle(rectangleStyle);
      rectangle.center.setIcon(cacheMarker);
      return;
    }

    var cacheRectangle = L.geoJson(cache.geometry);
    cacheRectangle.setStyle({fill: false, color: color, opacity: color ? 1 : 0, weight: 4});

    if (cache.geometry) {
      var center = turf.center(cache.geometry);
      cacheCenters.push(cache.geometry);
      var cacheCenter = L.marker([center.geometry.coordinates[1], center.geometry.coordinates[0]], {icon: cacheMarker});

      cacheCenter.bindPopup('<h5><a href="/#/cache/' + cache.id + '">' + cache.name + '</a></h5>');
      cacheCenter.on('popupopen', function() {
        $rootScope.$broadcast('cacheFootprintPopupOpen', cache);
        popupOpenId = cache.id;
        showCacheExtent(cache);
        $scope.$apply();
      });
      cacheCenter.on('popupclose', function() {
        $rootScope.$broadcast('cacheFootprintPopupClose', cache);
        popupOpenId = undefined;
        hideCacheExtent(cache);
        $scope.$apply();
      });
      cacheRectangle.addTo(map);
      cacheCenter.addTo(map);
      cacheFootprints[cache.id] = {footprint: cacheRectangle, center: cacheCenter};
    }
  }

  function showCacheTiles(cache) {
    if (mapLayer) {
      map.removeLayer(mapLayer);
    }
    // removeCacheTiles(cache);
    baseLayer.setOpacity(0.5);
    var layer = L.tileLayer("/api/caches/"+ cache.id + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken());
    layers[cache.id] = layer;
    layer.addTo(map);
  }

  function removeCacheTiles(cache) {
    var layer = layers[cache.id];
    if (layer) {
      map.removeLayer(layer);
      delete layers[cache.id];
    }
    if (Object.keys(layers).length === 0) {
      baseLayer.setOpacity(1);
    }
    if (mapLayer) {
      map.addLayer(mapLayer);
    }
  }

  $scope.$watch('options', function(options) {
    var newOptions = options || {
      maxZoom: 18,
      tms: false,
      opacity: 1
    };

    if (newOptions.baseLayerUrl) {
      if (baseLayer) {
        map.removeLayer(baseLayer);
      }
      defaultLayer = newOptions.baseLayerUrl;
      baseLayer = L.tileLayer(defaultLayer, newOptions);
      baseLayer.addTo(map);
      baseLayer.bringToBack();
    }
  });

  $scope.$watch('map.mapcacheUrl', function() {
    if (!$scope.map) return;
    if ($scope.map.dataSources) {
      var merged = _.reduce($scope.map.dataSources, function(merge, dataSource) {
        if (dataSource.geometry) {
          return turf.union(merge, dataSource.geometry);
        }
        return merge;
      }, $scope.map.dataSources[0].geometry);
      updateMapExtent(turf.extent(merged));
    }
    addMapLayer();
  });

  var legend;

  $scope.$watch('map.style', function(styles) {
    if (legend) {
      map.removeControl(legend);
    }
    if (!styles) return;
    legend = new L.Control.Legend(styles, {name: $scope.map.name});
    map.addControl(legend);
  });

  $scope.$watch('map.format', function(format, oldFormat) {
    if (format === oldFormat) return;

    mapLayerOptions.tms = 'tms' === format;
    addMapLayer();
  });

  $scope.$watch('map.wmsLayer', function(format, oldFormat) {
    if (format === oldFormat) return;
    addMapLayer();
  });

  $scope.$watch('map.data', function(data, oldData) {
    if (data === oldData) return;
    addMapLayer();
  });

  $scope.$watch('options.refreshMap', function(refresh) {
    if (refresh) {
      addMapLayer();
    }
  });

  $scope.$watch('options.extent', function(extent) {
    if (extent) {
      updateMapExtent(extent);
    }
  });

  $scope.$watch('map.extent', function(extent) {
    if (extent) {
      updateMapExtent(extent);
    }
  });

  var debounceDataSources = _.debounce(function() {
    $scope.$apply(function() {
      addMapLayer();
    });
  }, 500);

  var currentDatasources = [];
  var layerControl = L.control.groupedLayers([], []);
  map.on('overlayremove', function(event) {
    if (event.layer.dataSource) {
      currentDatasources = _.without(currentDatasources, event.layer.dataSource);
      debounceDataSources();
    }
  });
  map.on('overlayadd', function(event) {
    if (event.layer.dataSource) {
      currentDatasources.push(event.layer.dataSource);
      debounceDataSources();
    }
  });
  var layerControlAdded = false;
  var layerControlLayers = [];

  $scope.$watch('map.dataSources.length', function(length) {
    if (!$scope.map) return;
    currentDatasources = $scope.map.dataSources;
    if (length && $scope.map.dataSources.length > 1) {
      _.each(layerControlLayers, function(l) {
        map.removeLayer(l);
        layerControl.removeLayer(l);
      });

      _.each($scope.map.dataSources, function(ds) {
        var marker = L.marker([0,0],
        {
          opacity: 0.0,
          clickable: false,
          keyboard: false
        });
        marker.dataSource = ds;
        marker.addTo(map);
        layerControlLayers.push(marker);
        layerControl.addOverlay(marker, ds.name, "Data Sources");
      });
      if (!layerControlAdded) {
        layerControlAdded = true;
        layerControl.addTo(map);
      }
    }
  });

  function addMapLayer() {
    if (!$scope.map) return;
    if (mapLayer) {
      map.removeLayer(mapLayer);
    }

    var tl = LeafletUtilities.tileLayer($scope.map, defaultLayer, mapLayerOptions, $scope.map.style, styleFunction, currentDatasources);
    if (!tl) return;
    mapLayer = tl;
    tl.on('tileload', function(event) {
      var split = event.url.split('/');
      var z = split[split.length-3];
      var x = split[split.length-2];
      var y = split[split.length-1].split('.')[0];
      if ($scope.map.format === 'arcgis') {
        z = split[split.length-3];
        x = split[split.length-1];
        y = split[split.length-2];
      }
      mapTilesLoaded[z+'-'+x+'-'+y] = true;
      canvasTiles.redraw();
    });
    tl.on('tileerror', function(event) {
      var split = event.url.split('/');
      var z = split[split.length-3];
      var x = split[split.length-2];
      var y = split[split.length-1].split('.')[0];
      if ($scope.map.format === 'arcgis') {
        z = split[split.length-3];
        x = split[split.length-1];
        y = split[split.length-2];
      }
      mapTilesLoaded[z+'-'+x+'-'+y] = true;
      canvasTiles.redraw();
    });
    map.addLayer(canvasTiles);
    mapLayer.addTo(map);
    if ($scope.map.geometry) {
      updateMapExtent();
    }
  }

  function updateMapExtent(extent) {
    extent = extent || turf.extent($scope.map.geometry);
    map.fitBounds([
      [extent[1],extent[0]],
      [extent[3], extent[2]]
    ]);
  }

  function styleFunction(feature) {
    return LeafletUtilities.styleFunction(feature, $scope.map.style);
  }

  addMapLayer();
};

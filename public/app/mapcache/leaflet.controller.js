var L = require('leaflet')
  , turf = require('turf')
  , config = require('../config');

module.exports = function LeafletController($rootScope, $scope, $filter, $element, CacheService, LeafletUtilities, LocalStorageService) {
  var layers = {};
  var cacheFootprints = {};

  var oldCenter, oldZoom, highlightedCache;

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

  var map = L.map($element[0], {
    center: [45,0],
    zoom: 3,
    minZoom: 0,
    maxZoom: 18,
    worldCopyJump: true
  });
  map.addControl(new L.Control.ZoomIndicator());

  var baseLayer = L.tileLayer(config.defaultMapLayer);
  baseLayer.addTo(map);

  $scope.$watch('caches', function(caches) {
    if (!caches) return;

    for (var i = 0; i < caches.length; i++) {
      var cache = caches[i];
      if (!cacheFootprints[cache.id]) {
        createRectangle(cache);
      }
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

  $rootScope.$on('cacheFilterChange', function(event, filter) {
    CacheService.getAllCaches().then(function(caches) {
      $scope.caches = $filter('filter')($filter('filter')(caches, filter.cacheFilter), filter.mapFilter);
    });
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

    var center = turf.center(cache.geometry);
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

  function showCacheTiles(cache) {
    removeCacheTiles(cache);
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
  }

  function overlaySourceTiles(source) {
    removeSourceTiles(source);
    // baseLayer.setOpacity(.5);
    var layer = L.tileLayer("/api/sources/"+ source.id + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken());
    layers[source.id] = layer;
    layer.addTo(map);
  }

  function removeSourceTiles(source) {
    var layer = layers[source.id];
    if (layer) {
      map.removeLayer(layer);
      delete layers[source.id];
    }
  }

  $rootScope.$on('overlaySourceTiles', function(event, source) {
    if (source.geometry) {
      oldCenter = map.getCenter();
      oldZoom = map.getZoom();

      var extent = turf.extent(source.geometry);
      map.fitBounds([
        [extent[1],extent[0]],
        [extent[3], extent[2]]
      ]);
    }
    overlaySourceTiles(source);
  });

  $rootScope.$on('removeSourceTiles', function(event, source) {
    removeSourceTiles(source);
    map.setView(oldCenter, oldZoom);
  });
};

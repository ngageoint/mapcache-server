angular
  .module('mapcache')
  .directive('leaflet', leaflet);

function leaflet() {
  var directive = {
    restrict: "A",
    replace: true,
    template: '<div class="leaflet-map"></div>',
    controller: LeafletController,
    bindToController: true
  };

  return directive;
}

LeafletController.$inject = ['$rootScope', '$scope', '$interval', '$filter', '$element', 'CacheService', 'LeafletUtilities', 'LocalStorageService'];

function LeafletController($rootScope, $scope, $interval, $filter, $element, CacheService, LeafletUtilities, LocalStorageService) {
  var layers = {};
  var cacheFootprints = {};

  var oldCenter, oldZoom, highlightedCache;

  var map = L.map($element[0], {
    center: [45,0],
    zoom: 3,
    minZoom: 0,
    maxZoom: 18,
    worldCopyJump: true
  });
  map.addControl(new L.Control.ZoomIndicator());
  var loadingControl = L.Control.loading({
    separate: true
  });
  map.addControl(loadingControl);

  var baseLayer = L.tileLayer('http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png');
  baseLayer.addTo(map);

  $scope.$watch('caches', function(caches) {
    if (!caches) return;

    for (var i = 0; i < caches.length; i++) {
      var cache = caches[i];
      if (!cacheFootprints[cache.id]) {
        createRectangle(cache, "#0072c5");
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
    createRectangle(cache, "#ff7800");

  });

  $rootScope.$on('hideCacheExtent', function(event, cache) {
    createRectangle(cache, "#0072c5");
  });

  function showCache(cache) {
    if (!highlightedCache) {
      oldCenter = map.getCenter();
      oldZoom = map.getZoom();
    }
    highlightedCache = cache;
    // createRectangle(cache, "#ff7800");

    var extent = turf.extent(cache.geometry);
    console.log('extent', extent);
    map.fitBounds([
      [extent[1],extent[0]],
      [extent[3], extent[2]]
    ]);
    showCacheTiles(cache);
  }

  function hideCache(cache, moveMap) {
    if (highlightedCache && highlightedCache.id == cache.id) {
      // createRectangle(cache, "#0072c5");
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
    CacheService.getAllCaches().success(function(caches) {
      $scope.caches = $filter('filter')($filter('filter')(caches, filter.cacheFilter), filter.mapFilter);
    });
  });

  function createRectangle(cache, color) {
    var rectangle = cacheFootprints[cache.id];
    if (rectangle) {
      rectangle.setStyle({fillColor: color, color: color});
      return;
    }

    var gj = L.geoJson(cache.geometry);
    gj.addData(turf.center(cache.geometry));
    gj.setStyle({fill: false, color: color});
    gj.bindPopup('<h5><a href="/#/cache/' + cache.id + '">' + cache.name + '</a></h5>');
    gj.on('popupopen', function(e) {
      $rootScope.$broadcast('cacheFootprintPopupOpen', cache);
      $scope.$apply();
    });
    gj.on('popupclose', function(e) {
      $rootScope.$broadcast('cacheFootprintPopupClose', cache);
      $scope.$apply();
    });
    gj.addTo(map);
    cacheFootprints[cache.id] = gj;
  }

  function showCacheTiles(cache) {
    removeCacheTiles(cache);
    baseLayer.setOpacity(.5);
    var layer = L.tileLayer("/api/caches/"+ cache.id + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken());
    layers[cache.id] = layer;
    layer.addTo(map);
  }

  function removeCacheTiles(cache) {
    console.log('layers', layers);
    var layer = layers[cache.id];
    if (layer) {
      map.removeLayer(layer);
      delete layers[cache.id];
    }
    console.log('new layers', layers);
    if (Object.keys(layers).length == 0) {
      baseLayer.setOpacity(1);
    }
  }
}

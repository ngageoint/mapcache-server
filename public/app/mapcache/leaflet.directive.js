angular
  .module('mapcache')
  .directive('leaflet', leaflet);

function leaflet() {
  var directive = {
    restrict: "A",
    replace: true,
    template: '<div style="height:450px"></div>',
    controller: LeafletController,
    bindToController: true
  };

  return directive;
}

LeafletController.$inject = ['$rootScope', '$scope', '$interval', '$filter', '$element', 'CacheService'];

function LeafletController($rootScope, $scope, $interval, $filter, $element, CacheService) {
  var layers = {};
  var cacheFootprints = {};

  var map = L.map($element[0], {
    center: [0,0],
    zoom: 3,
    minZoom: 0,
    maxZoom: 18
  });

 L.tileLayer('http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png').addTo(map);


  // TODO move into leaflet service, this and map clip both use it
  function createRasterLayer(layerInfo) {
    var baseLayer = null;
    var options = {};
    if (layerInfo.format == 'XYZ' || layerInfo.format == 'TMS') {
      options = { tms: layerInfo.format == 'TMS', maxZoom: 18}
      layerInfo.layer = new L.TileLayer(layerInfo.url, options);
    } else if (layerInfo.format == 'WMS') {
      options = {
        layers: layerInfo.wms.layers,
        version: layerInfo.wms.version,
        format: layerInfo.wms.format,
        transparent: layerInfo.wms.transparent
      };

      if (layerInfo.wms.styles) options.styles = layerInfo.wms.styles;
      layerInfo.layer = new L.TileLayer.WMS(layerInfo.url, options);
    }

    layerControl.addBaseLayer(layerInfo.layer, layerInfo.name);

    if (layerInfo.options && layerInfo.options.selected) layerInfo.layer.addTo(map);
  }

  $scope.$watch('caches', function(caches) {
    if (!caches) return;
    // This is not optimal
    for (var cacheId in cacheFootprints) {
      var rectangle = cacheFootprints[cacheId];
      rectangle.setStyle({fillColor: "#333333", color: "#333333"});
    }
    for (var i = 0; i < caches.length; i++) {
      var cache = caches[i];
      createRectangle(cache, "#ff7800");
    }
  });

  $rootScope.$on('cacheHighlight', function(event, cache) {
    createRectangle(cache, "#007800");
  });

  $rootScope.$on('cacheUnhighlight', function(event, cache) {
    createRectangle(cache, "#ff7800");
  });

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
    gj.setStyle({fillColor: color, color: color});
    gj.bindPopup("<h5>" + cache.name + "</h5>");
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
    // going to old server for now
    var layer = L.tileLayer("https://mapcache.geointapps.org/api/caches/" + cache.name + "/{z}/{x}/{y}.png");
    layers[cache.id] = layer;
    layer.addTo(map);
  }

  function removeCacheTiles(cache) {
    var layer = layers[cache.id];
    if (layer) {
      map.removeLayer(layer);
    }
  }
}

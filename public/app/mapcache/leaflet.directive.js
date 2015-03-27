angular
  .module('mapcache')
  .directive('leaflet', leaflet);

function leaflet() {
  var directive = {
    restrict: "A",
    replace: true,
    template: '<div id="map"></div>',
    controller: LeafletController,
    bindToController: true
  };

  return directive;
}

LeafletController.$inject = ['$rootScope', '$scope', '$interval', 'CacheService'];

function LeafletController($rootScope, $scope, $interval, CacheService) {
  var layers = {};
  var cacheFootprints = {};

  var map = L.map("map", {
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

    layers[layerInfo.name] = layerInfo;
    layerControl.addBaseLayer(layerInfo.layer, layerInfo.name);

    if (layerInfo.options && layerInfo.options.selected) layerInfo.layer.addTo(map);
  }

  CacheService.getAllCaches().success(function(caches) {
    $scope.caches = caches;
  });

  $scope.$watch('caches', function(caches) {
    if (!caches) return;
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

  function createRectangle(cache, color) {
    var rectangle = cacheFootprints[cache._id];
    if (rectangle) {
      map.removeLayer(rectangle);
    }

    var bounds = [[cache.bounds._southWest.lat, cache.bounds._southWest.lng], [cache.bounds._northEast.lat, cache.bounds._northEast.lng]];
    var rectangle = L.rectangle(bounds, {color: color, weight: 1});
    cacheFootprints[cache._id] = rectangle;
    rectangle.addTo(map);
  }
}

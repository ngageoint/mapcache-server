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

LeafletController.$inject = ['$rootScope', '$scope', '$interval'];

function LeafletController($rootScope, $scope, $interval) {
  var layers = {};

  var map = L.map("map", {
    center: [0,0],
    zoom: 3,
    minZoom: 0,
    maxZoom: 18
  });

  L.tileLayer('http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

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
}

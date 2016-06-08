var L = require('leaflet')
  , config = require('../config');

module.exports = function LeafletController($element) {

  var map = L.map($element[0], {
    center: [45,0],
    zoom: 3,
    minZoom: 3,
    maxZoom: 3,
    worldCopyJump: true,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    boxZoom: false,
    zoomControl: false
  });

  var baseLayer = L.tileLayer(config.defaultMapLayer);
  baseLayer.addTo(map);
};

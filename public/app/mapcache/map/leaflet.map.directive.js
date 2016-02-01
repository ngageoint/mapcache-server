
module.exports = function leafletMap() {
  var directive = {
    restrict: "A",
    replace: true,
    template: '<div class="leaflet-map"></div>',
    scope: {
      map: '=',
      options: '=',
      caches: '=',
      dataSources: '='
    },
    controller: 'LeafletMapController'
  };

  return directive;
};

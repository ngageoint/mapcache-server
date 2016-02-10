module.exports = function leafletCache() {
  var directive = {
    restrict: "A",
    replace: true,
    template: '<div class="leaflet-map"></div>',
    scope: {
      cache: '=',
      options: '='
    },
    controller: 'LeafletCacheController'
  };

  return directive;
};

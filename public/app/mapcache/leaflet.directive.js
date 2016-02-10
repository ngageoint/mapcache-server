module.exports = function leaflet() {
  var directive = {
    restrict: "A",
    replace: true,
    template: '<div class="leaflet-map"></div>',
    controller: 'LeafletController',
    bindToController: true
  };

  return directive;
};

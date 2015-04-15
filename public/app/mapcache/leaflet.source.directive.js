angular
  .module('mapcache')
  .directive('leafletSource', leafletSource);

function leafletSource() {
  var directive = {
    restrict: "A",
    replace: true,
    template: '<div style="height: 500px;"></div>',
    scope: {
      source: '='
    },
    controller: LeafletSourceController
  };

  return directive;
}

LeafletSourceController.$inject = ['$scope', '$element'];

function LeafletSourceController($scope, $element) {

  var options = {
    maxZoom: 18,
    tms: false
  };

  var defaultLayer = '';//'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png';

  var baseLayer = L.tileLayer(defaultLayer, options);

  var map = L.map($element[0], {
    center: [45,0],
    zoom: 3,
    minZoom: 0,
    maxZoom: 18
  });

  baseLayer.addTo(map);

  var debounceUrl = _.debounce(function(url) {
    baseLayer.setUrl(getUrl(url));
  }, 500);

  $scope.$watch('source.url', function(url) {
    debounceUrl(url);
  });

  $scope.$watch('source.format', function(format, oldFormat) {
    if (format == oldFormat) return;

    options.tms = 'tms' == format;
    map.removeLayer(baseLayer);
    baseLayer = L.tileLayer(getUrl($scope.source.url), options);
    baseLayer.addTo(map);
  });

  function getUrl(url) {
    if (url == null || url == "") {
      return defaultLayer;
    } else {
      return url + "/{z}/{x}/{y}.png";
    }
  }
}

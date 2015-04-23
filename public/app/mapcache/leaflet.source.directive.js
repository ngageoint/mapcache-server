angular
  .module('mapcache')
  .directive('leafletSource', leafletSource);

function leafletSource() {
  var directive = {
    restrict: "A",
    replace: true,
    template: '<div style="height: 500px;"></div>',
    scope: {
      source: '=',
      options: '='
    },
    controller: LeafletSourceController
  };

  return directive;
}

LeafletSourceController.$inject = ['$scope', '$element', 'LocalStorageService'];

function LeafletSourceController($scope, $element, LocalStorageService) {

  var baseLayerOptions = $scope.options || {
    maxZoom: 18,
    tms: false,
    opacity: 1
  };

  var sourceLayerOptions = {
    maxZoom: 18,
    tms: false,
    opacity: 1
  };


  var defaultLayer = baseLayerOptions.baseLayerUrl;

  var baseLayer = L.tileLayer(defaultLayer, baseLayerOptions);
  var sourceLayer = null;

  var map = L.map($element[0], {
    center: [45,0],
    zoom: 3,
    minZoom: 0,
    maxZoom: 18
  });

  baseLayer.addTo(map);

  var debounceUrl = _.debounce(function(url) {
    if (sourceLayer) {
      map.removeLayer(sourceLayer);
    }
    sourceLayer = L.tileLayer(getUrl($scope.source), sourceLayerOptions);
    sourceLayer.addTo(map);
  }, 500);

  $scope.$watch('source.url', function(url) {
    if (url != null) {
      debounceUrl(url);
    }
  });

  $scope.$watch('source.format', function(format, oldFormat) {
    if (format == oldFormat) return;

    sourceLayerOptions.tms = 'tms' == format;
    if (sourceLayer) {
      map.removeLayer(sourceLayer);
    }
    sourceLayer = L.tileLayer(getUrl($scope.source), sourceLayerOptions);
    sourceLayer.addTo(map);
  });

  function getUrl(source) {
    console.log('changing source to ', source);
    if (source == null) {
      return defaultLayer;
    } else if (typeof source == "string") {
      return source + "/{z}/{x}/{y}.png";
    } else {
      return '/api/sources/'+ source.id + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken();
    }
  }
}

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

LeafletSourceController.$inject = ['$scope', '$element', 'LocalStorageService', 'SourceService', 'LeafletUtilities'];

function LeafletSourceController($scope, $element, LocalStorageService, SourceService, LeafletUtilities) {

  var sourceLayerOptions = {
    maxZoom: 18,
    tms: false,
    opacity: 1
  };

  var sourceLayer = null;
  var baseLayer = null;
  var defaultLayer = null;

  var map = L.map($element[0], {
    center: [45,-100],
    zoom: 4,
    minZoom: 0,
    maxZoom: 18
  });
  map.addControl(new L.Control.ZoomIndicator());
  map.on('click', function(event) {
    if (!$scope.source.style) return;
    if ($scope.source.style.title || $scope.source.style.description) {

      var pixelPoint = event.layerPoint;
      pixelPoint.y = pixelPoint.y + 5;
      pixelPoint.x = pixelPoint.x - 5;
      var latLngCorner = map.layerPointToLatLng(pixelPoint);
      var latLngDelta = {
        lng: event.latlng.lng - latLngCorner.lng,
        lat: event.latlng.lat - latLngCorner.lat
      };

      SourceService.getFeatures($scope.source, event.latlng.lng - latLngDelta.lng, event.latlng.lat - latLngDelta.lat, event.latlng.lng + latLngDelta.lng, event.latlng.lat + latLngDelta.lat, map.getZoom(), function(features) {
        if (!features) return;
        console.log("found some features", features);

        var title = "";
        if ($scope.source.style.title && features[0].properties && features[0].properties[$scope.source.style.title]) {
          title = features[0].properties[$scope.source.style.title];
        }
        var description = "";
        if ($scope.source.style.description && features[0].properties && features[0].properties[$scope.source.style.description]) {
          description = features[0].properties[$scope.source.style.description];
        }
        var popupContent = title + " " + description;

        var popup = L.popup()
          .setLatLng(event.latlng)
          .setContent(popupContent)
          .openOn(map);
      });
    }
  });

  $scope.$watch('options', function(options) {
    var newOptions = options || {
      maxZoom: 18,
      tms: false,
      opacity: 1
    };

    if (newOptions.baseLayerUrl) {
      if (baseLayer) {
        map.removeLayer(baseLayer);
      }
      defaultLayer = newOptions.baseLayerUrl;
      baseLayer = L.tileLayer(defaultLayer, newOptions);
      baseLayer.addTo(map);
      baseLayer.bringToBack();
    }
  });

  var debounceUrl = _.debounce(function(url) {
    $scope.$apply(function() {
      addSourceLayer();
    });
  }, 500);

  $scope.$watch('source.url', function(url) {
    if (url != null) {
      debounceUrl(url);
    }
  });

  $scope.$watch('source.format', function(format, oldFormat) {
    if (format == oldFormat) return;

    sourceLayerOptions.tms = 'tms' == format;
    addSourceLayer();
  });

  $scope.$watch('source.previewLayer', function(format, oldFormat) {
    if (format == oldFormat) return;
    addSourceLayer();
  });

  $scope.$watch('source.data', function(data, oldData) {
    if (data == oldData) return;
    addSourceLayer();
  });

  $scope.$watch('options.refreshMap', function(refresh, oldRefresh) {
    if (refresh) {
      addSourceLayer();
    }
  });

  $scope.$watch('options.extent', function(extent, oldExtent) {
    if (extent) {
      updateMapExtent(extent);
    }
  });

  $scope.$watch('source.extent', function(extent, oldExtent) {
    if (extent) {
      updateMapExtent(extent);
    }
  });

  function addSourceLayer() {
    if (sourceLayer) {
      map.removeLayer(sourceLayer);
    }
    var tl = LeafletUtilities.tileLayer($scope.source, defaultLayer, sourceLayerOptions, $scope.source.style, styleFunction);
    if (!tl) return;
    sourceLayer = tl;
    sourceLayer.addTo(map);
    if ($scope.source.geometry) {
      updateMapExtent();
    }
  }

  function updateMapExtent(extent) {
    var extent = extent || turf.extent($scope.source.geometry);
    map.fitBounds([
      [extent[1],extent[0]],
      [extent[3], extent[2]]
    ]);
  }

  function styleFunction(feature) {
    return LeafletUtilities.styleFunction(feature, $scope.source.style);
  }

  addSourceLayer();
}

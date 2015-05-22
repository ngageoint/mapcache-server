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

LeafletSourceController.$inject = ['$scope', '$element', 'LocalStorageService', 'SourceService'];

function LeafletSourceController($scope, $element, LocalStorageService, SourceService) {

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

  var sourceLayer = null;

  var map = L.map($element[0], {
    center: [45,0],
    zoom: 3,
    minZoom: 0,
    maxZoom: 18
  });
  map.addControl(new L.Control.ZoomIndicator());

  if (baseLayerOptions.baseLayerUrl) {
    var defaultLayer = baseLayerOptions.baseLayerUrl;
    var baseLayer = L.tileLayer(defaultLayer, baseLayerOptions);
    baseLayer.addTo(map);
  }

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
    addSourceLayer();
  });

  $scope.$watch('source.data', function(data, oldData) {
    addSourceLayer();
  });

  $scope.$watch('source.style', function(style, oldStyle) {
    if (!style) return;
    if (sourceLayer) {
      sourceLayer.setStyle(styleFunction);
    }
  }, true);

  $scope.$watch('source.extent', function(extent, oldExtent) {
    if (extent) {
      updateMapExtent(extent);
    }
  });

  function addSourceLayer() {
    if (sourceLayer) {
      map.removeLayer(sourceLayer);
    }
    var tl = getTileLayer($scope.source);
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
    if (!$scope.source.style) return {};
    var sorted = _.sortBy($scope.source.style, 'priority');
    for (var i = 0; i < sorted.length; i++) {
      var styleProperty = sorted[i];
      var key = styleProperty.key;
      if (feature.properties && feature.properties[key]) {
        if (feature.properties[key] == styleProperty.value) {
          return {
            color: styleProperty.style['stroke'],
            fillOpacity: styleProperty.style['fill-opacity'],
            opacity: styleProperty.style['stroke-opacity'],
            weight: styleProperty.style['stroke-width'],
            fillColor: styleProperty.style['fill']
          };
        }
      }
    }
    var defaultStyle = _.find($scope.source.style, function(style) {
      return !style.key;
    });

    return {
      color: defaultStyle.style['stroke'],
      fillOpacity: defaultStyle.style['fill-opacity'],
      opacity: defaultStyle.style['stroke-opacity'],
      weight: defaultStyle.style['stroke-width'],
      fillColor: defaultStyle.style['fill']
    }
  }

  function getTileLayer(source) {
    console.log('changing source to ', source);
    if (source == null) {
      return L.tileLayer(defaultLayer, sourceLayerOptions);
    } else if (source.format == 'shapefile') {
      if (!source.data) return;
      var gj = L.geoJson(source.data, {
        style: styleFunction
      });

      return gj;
    } else if (typeof source == "string") {
      return L.tileLayer(source + "/{z}/{x}/{y}.png", sourceLayerOptions);
    } else if (source.id) {
      var url = '/api/sources/'+ source.id + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken();
      if (source.previewLayer) {
        url += '&layer=' + source.previewLayer.Name;
      }
      return L.tileLayer(url, sourceLayerOptions);
    } else if (source.format == "wms") {
      if (source.wmsGetCapabilities && source.previewLayer) {
        return L.tileLayer.wms(source.url, {
          layers: source.previewLayer.Name,
          version: source.wmsGetCapabilities.version,
          transparent: !source.previewLayer.opaque
        });
      }
    } else if (!source.id && source.url) {
      return L.tileLayer(source.url + "/{z}/{x}/{y}.png", sourceLayerOptions);
    }
  }

  addSourceLayer();
}

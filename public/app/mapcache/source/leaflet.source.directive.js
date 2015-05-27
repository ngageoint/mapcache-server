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

  var sourceLayerOptions = {
    maxZoom: 18,
    tms: false,
    opacity: 1
  };

  var sourceLayer = null;
  var baseLayer = null;

  var map = L.map($element[0], {
    center: [45,0],
    zoom: 3,
    minZoom: 0,
    maxZoom: 18
  });
  map.addControl(new L.Control.ZoomIndicator());

  $scope.$watch('options', function(options) {
    console.log('options are', options);
    var newOptions = options || {
      maxZoom: 18,
      tms: false,
      opacity: 1
    };

    if (newOptions.baseLayerUrl) {
      if (baseLayer) {
        map.removeLayer(baseLayer);
      }
      var defaultLayer = newOptions.baseLayerUrl;
      baseLayer = L.tileLayer(defaultLayer, newOptions);
      baseLayer.addTo(map);
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
    addSourceLayer();
  });

  $scope.$watch('source.data', function(data, oldData) {
    addSourceLayer();
  });

  $scope.$watch('source.style', function(style, oldStyle) {
    if (!style) return;
    if (sourceLayer) {
      sourceLayer.setStyle(styleFunction);
      if (style.title || style.description) {
        sourceLayer.eachLayer(function(layer) {
          var title = "";
          if (this.title && layer.feature.properties && layer.feature.properties[this.title]) {
            title = layer.feature.properties[this.title];
          }
          var description = "";
          if (this.description && layer.feature.properties && layer.feature.properties[this.description]) {
            description = layer.feature.properties[this.description];
          }
          layer.bindPopup(title + " " + description);
        }, style);
      } else {
        sourceLayer.eachLayer(function(layer) {
          layer.unbindPopup();
        });
      }
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

  function pointToLayer(feature, latlng) {
    return L.circleMarker(latlng, {radius: 3});
  }

  function styleFunction(feature) {
    if (!$scope.source.style) return {};

    if ($scope.source.style.styles) {
      var sorted = _.sortBy($scope.source.style.styles, 'priority');
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
    }
    var defaultStyle = $scope.source.style.defaultStyle;
    if (!defaultStyle) {
      return {};
    }

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
    } else if (source.vector) {
      if (!source.data) return;
      var gj = L.geoJson(source.data, {
        style: styleFunction,
        pointToLayer: pointToLayer,
        onEachFeature: function(feature, layer) {
          if ($scope.source.style && ($scope.source.style.title || $scope.source.style.description)) {
            var title = "";
            if ($scope.source.style.title && feature.properties && feature.properties[$scope.source.style.title]) {
              title = feature.properties[$scope.source.style.title];
            }
            var description = "";
            if ($scope.source.style.description && feature.properties && feature.properties[$scope.source.style.description]) {
              description = feature.properties[$scope.source.style.description];
            }
            layer.bindPopup(title + " " + description);
          }
        }
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

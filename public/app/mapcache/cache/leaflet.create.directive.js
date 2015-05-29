angular
  .module('mapcache')
  .directive('leafletCreate', leafletCreate);

function leafletCreate() {
  var directive = {
    restrict: "A",
    replace: true,
    template: '<div style="height: 500px;"></div>',
    scope: {
      options: '='
    },
    controller: LeafletCreateController
  };

  return directive;
}

LeafletCreateController.$inject = ['$scope', '$element', 'LocalStorageService', 'SourceService', 'LeafletUtilities'];

function LeafletCreateController($scope, $element, LocalStorageService, SourceService, LeafletUtilities) {

  var options = {
    maxZoom: 18,
    tms: false
  };

  var defaultLayer = 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png';

  var baseLayer = L.tileLayer(defaultLayer, options);
  var sourceLayer;
  var sourceBoundsLayer;

  var map = L.map($element[0], {
    center: [0,0],
    zoom: 3,
    minZoom: 0,
    maxZoom: 18,
    worldCopyJump: true
  });

  baseLayer.addTo(map);
  map.addControl(new L.Control.ZoomIndicator());

  var cacheFootprintLayer = null;

  var drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  var drawOptions = {
    draw: {
        polyline: false,
        polygon: false,
        circle: false, // Turns off this drawing tool
        rectangle: {
            shapeOptions: {
                clickable: false,
                color: "#0072c5"
            }
        },
        marker: false
    },
    edit: {
      featureGroup: drawnItems,
      remove: false,
      edit: {
        selectedPathOptions: {
          maintainColor: true,
          opacity: 0.5,
          dashArray:"10, 10"
        }
      }
    }
  };

  var drawControl = new L.Control.Draw(drawOptions);
  map.addControl(drawControl);

  map.on('draw:drawstart', function (e) {
    if (cacheFootprintLayer) {
      drawnItems.removeLayer(cacheFootprintLayer);
      cacheFootprintLayer = null;
      $scope.$apply(function() {
        $scope.options.geometry = null;
      });
    }
  });

  map.on('draw:created', function (e) {
    var layer = e.layer;
    cacheFootprintLayer = layer;

    drawnItems.addLayer(cacheFootprintLayer);
    $scope.$apply(function() {
      $scope.options.geometry = cacheFootprintLayer.toGeoJSON().geometry;
    });
  });

  map.on('draw:edited', function (e) {
    var layer = e.layers.getLayers()[0];
    cacheFootprintLayer = layer;

    drawnItems.addLayer(cacheFootprintLayer);
    $scope.$apply(function() {
      $scope.options.geometry = cacheFootprintLayer.toGeoJSON();
    });
  });

  $scope.$on('extentChanged', function(event, envelope) {
    console.log('extent', envelope);
    drawnItems.removeLayer(cacheFootprintLayer);
    cacheFootprintLayer = null;
    if (envelope) {
      var gj = turf.bboxPolygon([envelope.west, envelope.south, envelope.east, envelope.north]);
      $scope.options.geometry = gj.geometry;
      cacheFootprintLayer = L.rectangle([[envelope.south, envelope.west], [envelope.north, envelope.east]]);
      cacheFootprintLayer.setStyle({color: "#0072c5", clickable: false});
      drawnItems.addLayer(cacheFootprintLayer);
    }
  });

  $scope.$watch('options.extent', function(extent, oldExtent) {
    if (extent) {
      updateMapExtent(extent);
    }
  });

  function updateMapExtent(extent) {
    map.fitBounds([
      [extent[1],extent[0]],
      [extent[3], extent[2]]
    ]);
  }

  $scope.$watch('options.useCurrentView', function(newValue, oldValue) {
    if (!$scope.options.useCurrentView || oldValue == newValue) return;
    drawnItems.removeLayer(cacheFootprintLayer);
    cacheFootprintLayer = null;
    var bounds = map.getBounds();
    var gj = turf.bboxPolygon([bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]);
    $scope.options.geometry = gj.geometry;
    cacheFootprintLayer = L.rectangle([bounds]);
    cacheFootprintLayer.setStyle({color: "#0072c5", clickable: false});
    drawnItems.addLayer(cacheFootprintLayer);
  });

  $scope.$watch('options.source.geometry', function(geometry) {
    if (sourceBoundsLayer) {
      map.removeLayer(sourceBoundsLayer);
    }
    if (!geometry) return;
    sourceBoundsLayer = L.geoJson({type: "FeatureCollection", features:[geometry]});
    sourceBoundsLayer.setStyle({fill: false, color: "#308014", clickable: false});
    sourceBoundsLayer.addTo(map);
    sourceBoundsLayer.bringToFront();
    map.fitBounds(sourceBoundsLayer.getBounds());
  });

  $scope.$watch('options.source.data', function(data, oldData) {
    if (sourceLayer) {
      map.removeLayer(sourceLayer);
    }
    sourceLayer = LeafletUtilities.tileLayer($scope.options.source, defaultLayer, options, $scope.options.style, styleFunction);
    if (!sourceLayer) return;
    sourceLayer.addTo(map);
  });

  $scope.$watch('options.source', function(source) {
    if (sourceLayer) {
      map.removeLayer(sourceLayer);
    }
    sourceLayer = LeafletUtilities.tileLayer($scope.options.source, defaultLayer, options, $scope.options.style, styleFunction);
    if (!sourceLayer) return;
    sourceLayer.addTo(map);
  });

  $scope.$watch('options.source.previewLayer', function(previewLayer) {
    if (sourceLayer) {
      map.removeLayer(sourceLayer);
    }
    sourceLayer = LeafletUtilities.tileLayer($scope.options.source, defaultLayer, options, $scope.options.style, styleFunction);
    if (!sourceLayer) return;
    sourceLayer.addTo(map);
  });

  $scope.$watch('options.source.format', function(format, oldFormat) {
    if (format == oldFormat) return;

    options.tms = 'tms' == format;
    if (sourceLayer) {
      map.removeLayer(sourceLayer);
    }
    sourceLayer = LeafletUtilities.tileLayer($scope.options.source, defaultLayer, options, $scope.options.style, styleFunction);
    if (!sourceLayer) return;
    sourceLayer.addTo(map);
  });

  function styleFunction(feature) {
    return LeafletUtilities.styleFunction(feature, $scope.options.style);
  }

  // function pointToLayer(feature, latlng) {
  //   return L.circleMarker(latlng, {radius: 3});
  // }
  //
  // function getTileLayer(source) {
  //   console.log('changing source to ', source);
  //   if (source == null) {
  //     return L.tileLayer(defaultLayer, options);
  //   } else if (source.vector) {
  //     var gj = L.geoJson(source.data, {
  //       style: styleFunction,
  //       pointToLayer: pointToLayer,
  //       onEachFeature: function(feature, layer) {
  //         LeafletUtilities.popupFunction(feature, layer, $scope.source.style);
  //       }
  //     });
  //     SourceService.getSourceData(source, function(data) {
  //       $scope.options.source.data = data;
  //       $scope.options.extent = turf.extent(data);
  //       gj.addData(data);
  //     });
  //
  //     return gj;
  //   } else if (typeof source == "string") {
  //     return L.tileLayer(source + "/{z}/{x}/{y}.png", options);
  //   } else if (source.id) {
  //     var url = '/api/sources/'+ source.id + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken();
  //     if (source.previewLayer) {
  //       url += '&layer=' + source.previewLayer.Name;
  //     }
  //     return L.tileLayer(url, options);
  //   } else if (source.format == "wms") {
  //     if (source.wmsGetCapabilities && source.previewLayer) {
  //       return L.tileLayer.wms(source.url, {
  //         layers: source.previewLayer.Name,
  //         version: source.wmsGetCapabilities.version,
  //         transparent: !source.previewLayer.opaque
  //       });
  //     }
  //   }
  // }
}

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

LeafletCreateController.$inject = ['$scope', '$element', 'LocalStorageService', 'LeafletUtilities'];

function LeafletCreateController($scope, $element, LocalStorageService, LeafletUtilities) {

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
      $scope.options.geometry = cacheFootprintLayer.toGeoJSON().geometry;
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
    var gj = turf.bboxPolygon([Math.max(-180,bounds.getWest()), Math.max(-90,bounds.getSouth()), Math.min(180,bounds.getEast()), Math.min(90,bounds.getNorth())]);
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
}

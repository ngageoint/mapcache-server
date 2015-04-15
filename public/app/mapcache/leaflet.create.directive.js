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

LeafletCreateController.$inject = ['$scope', '$element', 'LocalStorageService'];

function LeafletCreateController($scope, $element, LocalStorageService) {

  var options = {
    maxZoom: 18,
    tms: false
  };

  var defaultLayer = 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png';

  var baseLayer = L.tileLayer(defaultLayer, options);
  var sourceLayer;

  var map = L.map($element[0], {
    center: [0,0],
    zoom: 3,
    minZoom: 0,
    maxZoom: 18,
    worldCopyJump: true
  });

  baseLayer.addTo(map);

  var cacheFootprintLayer = null;

  var drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  var options = {
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

  var drawControl = new L.Control.Draw(options);
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

  $scope.$watch('options.source.geometry', function(geometry) {
    var gj = L.geoJson({type: "FeatureCollection", features:[geometry]});
    gj.setStyle({fill: false, color: "#308014", clickable: false});
    gj.addTo(map);
    gj.bringToFront();
    map.fitBounds(gj.getBounds());
  });

  $scope.$watch('options.source', function(source) {
    if (sourceLayer) {
      map.removeLayer(sourceLayer);
    }
    sourceLayer = L.tileLayer(getUrl($scope.options.source), options);
    sourceLayer.addTo(map);
  });

  $scope.$watch('options.source.format', function(format, oldFormat) {
    if (format == oldFormat) return;

    options.tms = 'tms' == format;
    if (sourceLayer) {
      map.removeLayer(sourceLayer);
    }
    sourceLayer = L.tileLayer(getUrl($scope.options.source), options);
    sourceLayer.addTo(map);
  });

  function getUrl(source) {
    if (source == null) {
      return defaultLayer;
    } else {

      return '/api/sources/' + source.id + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken();
    }
  }
}
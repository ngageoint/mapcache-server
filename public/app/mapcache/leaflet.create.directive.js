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

LeafletCreateController.$inject = ['$scope', '$element'];

function LeafletCreateController($scope, $element) {

  var options = {
    maxZoom: 18,
    tms: false
  };

  var defaultLayer = 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png';

  var baseLayer = L.tileLayer(defaultLayer, options);

  var map = L.map($element[0], {
    center: [45,0],
    zoom: 3,
    minZoom: 0,
    maxZoom: 18
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

  $scope.$watch('options.url', function(url) {
    baseLayer.setUrl(getUrl(url));
  });

  $scope.$watch('options.tms', function(tms, oldTms) {
    if (tms == oldTms) return;

    options.tms = tms;
    map.removeLayer(baseLayer);
    baseLayer = L.tileLayer(getUrl($scope.options.url), options);
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

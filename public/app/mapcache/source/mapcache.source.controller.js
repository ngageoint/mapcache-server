angular
  .module('mapcache')
  .controller('MapcacheSourceController', MapcacheSourceController);

MapcacheSourceController.$inject = [
  '$scope',
  '$location',
  '$timeout',
  '$routeParams',
  'CacheService',
  'SourceService'
];

function MapcacheSourceController($scope, $location, $timeout, $routeParams, CacheService, SourceService) {

  $scope.mapOptions = {
    baseLayerUrl: 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png',
    opacity: .14
  };

  $scope.source = {
    id: $routeParams.sourceId
  };

  $scope.featureProperties = [];
  $scope.newRule = {
    style: {
      'fill': "#000000",
      'fill-opacity': 0.5,
      'stroke': "#0000FF",
      'stroke-opacity': 1.0,
      'stroke-width': 1
    }
  };

  $scope.createCacheFromSource = function() {
    $location.path('/create/'+$routeParams.sourceId);
  }

  $scope.$watch('source.previewLayer', function(layer, oldLayer) {
    if (layer) {
      if (layer.EX_GeographicBoundingBox) {
        $scope.mapOptions.extent = layer.EX_GeographicBoundingBox;
      }
    }
  });

  $scope.applyStyle = function() {
    var tmp = angular.copy($scope.newRule);
    $scope.newRule.key = $scope.newRule.property.key;
    $scope.newRule.value = $scope.newRule.property.value;
    $scope.newRule.priority = $scope.source.style.length;
    delete $scope.newRule.property;
    $scope.source.style.push($scope.newRule);
    $scope.newRule = tmp;
    delete $scope.newRule.property;
  }

  $scope.saveStyle = function() {
    SourceService.saveSource($scope.source, function(source) {
      console.log('saved successfully', source);
    }, function(error) {
      console.log('error saving source', error);
    });
  }

  $scope.deleteStyle = function(style) {
    $scope.source.style = _.without($scope.source.style, style);
  }

  $scope.editStyle = function(style) {

  }

  $scope.promoteStyle = function(style) {
    var toMove = _.findWhere($scope.source.style, {priority: style.priority-1});
    style.priority = style.priority - 1;
    if (toMove) {
      toMove.priority = toMove.priority + 1;
    }
  }

  $scope.demoteStyle = function(style) {
    var toMove = _.findWhere($scope.source.style, {priority: style.priority+1});
    style.priority = style.priority + 1;
    if (toMove) {
      toMove.priority = toMove.priority - 1;
    }
  }

  function getSource() {
    SourceService.refreshSource($scope.source, function(source) {
      // success
      $scope.source = source;
      if (!source.complete && $location.path().startsWith('/source')) {
        $timeout(getSource, 5000);
      } else {
        if (source.format == 'shapefile') {
          $scope.source.style = $scope.source.style || [];
          SourceService.getSourceData(source, function(data) {
            var allProperties = {};
            for (var i = 0; i < data.features.length; i++) {
              var feature = data.features[i];
              for (var property in feature.properties) {
                allProperties[property] = allProperties[property] || {key: property, values:[]};
                if (_.indexOf(allProperties[property].values, feature.properties[property]) == -1) {
                  allProperties[property].values.push(feature.properties[property]);
                }
              }
            }
            for (var property in allProperties) {
              $scope.featureProperties.push(allProperties[property]);
            }
            $scope.source.data = data;
          });
        }
      }
    }, function(data) {
      // error
    });
  }

  getSource();

};

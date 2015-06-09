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

  var defaultStyle = {
    'fill': "#000000",
    'fill-opacity': 0.5,
    'stroke': "#0000FF",
    'stroke-opacity': 1.0,
    'stroke-width': 1
  };

  $scope.featureProperties = [];
  $scope.newRule = {
    style: angular.copy(defaultStyle)
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
    $scope.source.style.styles.push($scope.newRule);
    $scope.newRule = tmp;
    delete $scope.newRule.property;
  }

  $scope.saveStyle = function() {
    SourceService.saveSource($scope.source, function(source) {
      console.log('saved successfully', source);
      $scope.mapOptions.refreshMap = Date.now();
    }, function(error) {
      console.log('error saving source', error);
    });
  }

  $scope.$on('deleteStyle', function(event, style) {
    $scope.source.style.styles = _.without($scope.source.style.styles, style);
  });

  $scope.$on('promoteStyle', function(event, style) {
    var toMove = _.findWhere($scope.source.style.styles, {priority: style.priority-1});
    style.priority = style.priority - 1;
    if (toMove) {
      toMove.priority = toMove.priority + 1;
    }
  });

  $scope.$on('demoteStyle', function(event, style) {
    var toMove = _.findWhere($scope.source.style.styles, {priority: style.priority+1});
    style.priority = style.priority + 1;
    if (toMove) {
      toMove.priority = toMove.priority - 1;
    }
  });

  $scope.isNotDefault = function(style) {
    return style.key;
  }

  function getSource() {
    SourceService.refreshSource($scope.source, function(source) {
      // success
      $scope.source = source;
      if (!source.complete && $location.path().startsWith('/source')) {
        $timeout(getSource, 5000);
      } else {
        if (source.vector) {
          $scope.mapOptions.opacity = 1;
          $scope.source.style = $scope.source.style || {styles:[], defaultStyle: {style: angular.copy(defaultStyle)}};
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
            $scope.source.extent = turf.extent(data);
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

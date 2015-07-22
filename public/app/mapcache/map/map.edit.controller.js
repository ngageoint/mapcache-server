angular
  .module('mapcache')
  .controller('MapEditController', MapEditController);

MapEditController.$inject = [
  '$scope',
  '$rootScope',
  '$routeParams',
  '$location',
  '$timeout',
  '$http',
  'MapService',
  'LocalStorageService'
];

function MapEditController($scope, $rootScope, $routeParams, $location, $timeout, $http, MapService, LocalStorageService) {
  $scope.tab='general';
  $scope.token = LocalStorageService.getToken();
  $scope.mapOptions = {
    baseLayerUrl: 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png',
    opacity: .5,
    hideFilter: true
  };

  $scope.unsavedChanges = false;

  $rootScope.title = 'Map Edit';
  $scope.map = {
    id: $routeParams.mapId
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

  var initialLoadComplete = false;

  $scope.$watch('map', function(map, oldMap) {
    console.log('map change unsavedChanges: ' + $scope.unsavedChanges + ' initialLoadComplete: ' + initialLoadComplete);
    if (map.name && !initialLoadComplete) {
      initialLoadComplete = true;
    } else if (initialLoadComplete) {
      console.log('setting unsaved to true');
      $scope.unsavedChanges = true;
    }
    console.log('now it is map change unsavedChanges: ' + $scope.unsavedChanges + ' initialLoadComplete: ' + initialLoadComplete);

  }, true);

  $scope.$watch('map.previewLayer', function(layer, oldLayer) {
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
    $scope.newRule.priority = $scope.map.style.length;
    delete $scope.newRule.property;
    $scope.map.style.styles.push($scope.newRule);
    $scope.newRule = tmp;
    delete $scope.newRule.property;
  }

  $scope.saveMap = function() {
    MapService.saveMap($scope.map, function(map) {
      console.log('saved successfully', map);
      $scope.map = map;
      $scope.mapOptions.refreshMap = Date.now();
      $scope.unsavedChanges = false;
    }, function(error) {
      console.log('error saving map', error);
    });
  }

  $scope.$on('deleteStyle', function(event, style) {
    $scope.map.style.styles = _.without($scope.map.style.styles, style);
  });

  $scope.$on('promoteStyle', function(event, style) {
    var toMove = _.findWhere($scope.map.style.styles, {priority: style.priority-1});
    style.priority = style.priority - 1;
    if (toMove) {
      toMove.priority = toMove.priority + 1;
    }
  });

  $scope.$on('demoteStyle', function(event, style) {
    var toMove = _.findWhere($scope.map.style.styles, {priority: style.priority+1});
    style.priority = style.priority + 1;
    if (toMove) {
      toMove.priority = toMove.priority - 1;
    }
  });

  $scope.isNotDefault = function(style) {
    return style.key;
  }

  function getMap() {
    MapService.refreshMap($scope.map, function(map) {
      // success
      $scope.map = map;
      $rootScope.title = 'Edit - ' +map.name;
      if (map.vector) {
        $scope.mapOptions.opacity = 1;
        $scope.map.style = $scope.map.style || {styles:[], defaultStyle: {style: angular.copy(defaultStyle)}};
      }
      console.log('unsaved is now false');
      $scope.unsavedChanges = false;
      initialLoadComplete = false;
    }, function(data) {
      // error
    });
  }

  getMap();

}

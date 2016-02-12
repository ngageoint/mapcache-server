var angular = require('angular');
var _ = require('underscore');

module.exports = function MapEditController($scope, $rootScope, $routeParams, MapService, LocalStorageService) {
  $scope.tab='general';
  $scope.token = LocalStorageService.getToken();
  $scope.mapOptions = {
    baseLayerUrl: 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png',
    opacity: 0.5,
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

  $scope.$watch('map', function(map) {
    if (map.name && !initialLoadComplete) {
      initialLoadComplete = true;
    } else if (initialLoadComplete) {
      $scope.unsavedChanges = true;
    }
  }, true);

  $scope.deleteDataSource = function(id) {
    MapService.deleteDataSource($scope.map, id, function(newMap) {
      $scope.map = newMap;
    });
  };

  $scope.setStyleTab = function(id) {
    $scope.styleTab = _.find($scope.map.dataSources, function(ds) {
      return ds.id === id;
    });
    $scope.tab = id;
  };

  $scope.applyStyle = function() {
    var tmp = angular.copy($scope.newRule);
    $scope.newRule.key = $scope.newRule.property.key;
    $scope.newRule.value = $scope.newRule.property.value;
    $scope.newRule.priority = $scope.styleTab.style.styles.length;
    delete $scope.newRule.property;
    $scope.styleTab.style.styles.push($scope.newRule);
    $scope.newRule = tmp;
    delete $scope.newRule.property;
  };

  $scope.saveMap = function() {
    MapService.saveMap($scope.map, function(map) {
      $scope.map = map;
      $scope.setStyleTab($scope.tab);
      $scope.mapOptions.refreshMap = Date.now();
      $scope.unsavedChanges = false;
    }, function(error) {
      console.log('error saving map', error);
    });
  };

  $scope.$on('deleteStyle', function(event, style) {
    $scope.styleTab.style.styles = _.without($scope.styleTab.style.styles, style);
  });

  $scope.$on('promoteStyle', function(event, style) {
    var toMove = _.findWhere($scope.styleTab.style.styles, {priority: style.priority-1});
    style.priority = style.priority - 1;
    if (toMove) {
      toMove.priority = toMove.priority + 1;
    }
  });

  $scope.$on('demoteStyle', function(event, style) {
    var toMove = _.findWhere($scope.styleTab.style.styles, {priority: style.priority+1});
    style.priority = style.priority + 1;
    if (toMove) {
      toMove.priority = toMove.priority - 1;
    }
  });

  function getMap() {
    MapService.refreshMap($scope.map, function(map) {
      // success
      $scope.map = map;
      $rootScope.title = 'Edit - ' +map.name;
      if (map.vector) {
        $scope.mapOptions.opacity = 1;
        $scope.map.style = $scope.map.style || {styles:[], defaultStyle: {style: angular.copy(defaultStyle)}};
      }
      $scope.unsavedChanges = false;
      initialLoadComplete = false;
    }, function() {
      // error
    });
  }

  getMap();

};

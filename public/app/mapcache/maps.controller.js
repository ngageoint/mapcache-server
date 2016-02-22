var _ = require('underscore');
module.exports = function MapsController($scope, $rootScope, LocalStorageService, MapService) {
  $scope.token = LocalStorageService.getToken();
  $rootScope.title = 'Maps';

  $scope.mapOptions = {
    baseLayerUrl: 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png',
    opacity: 0.5
  };

  MapService.getAllMaps(true).then(function(maps) {
    $scope.maps = maps;

    _.each($scope.maps, function(map) {
      if (_.some(map.dataSources, function(value) { return !value.status.complete; })) {
        map.mapComplete = false;
      } else {
        map.mapComplete = true;
      }
    });

  });

};

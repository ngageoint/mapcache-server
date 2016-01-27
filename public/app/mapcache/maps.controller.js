angular
  .module('mapcache')
  .controller('MapsController', MapsController);

MapsController.$inject = [
  '$scope',
  '$rootScope',
  'LocalStorageService',
  'CacheService',
  'MapService'
];

function MapsController($scope, $rootScope, LocalStorageService, CacheService, MapService) {
  $scope.token = LocalStorageService.getToken();
  $rootScope.title = 'Maps';

  $scope.mapOptions = {
    baseLayerUrl: 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png',
    opacity: 0.5
  };

  MapService.getAllMaps(true).success(function(maps) {
    $scope.maps = maps;

    _.each($scope.maps, function(map) {
      if (_.some(map.dataSources, function(value) { return !value.status.complete; })) {
        map.mapComplete = false;
      } else {
        map.mapComplete = true;
      }
    });

  });

}

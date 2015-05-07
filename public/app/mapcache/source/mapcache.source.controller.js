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

  $scope.createCacheFromSource = function() {
    $location.path('/create/'+$routeParams.sourceId);
  }

  function getSource() {
    SourceService.refreshSource($scope.source, function(source) {
      // success
      $scope.source = source;
      if (!source.complete && $location.path().startsWith('/source')) {
        $timeout(getSource, 5000);
      }
    }, function(data) {
      // error
    });
  }

  getSource();

};

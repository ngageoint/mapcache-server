angular
  .module('mapcache')
  .controller('MapcacheCreateController', MapcacheCreateController);

MapcacheCreateController.$inject = [
  '$scope',
  '$location',
  '$modal',
  'CacheService',
  'SourceService'
];

function MapcacheCreateController($scope, $location, $modal, CacheService, SourceService) {

  var seenCorners;

  $scope.cache = {
    format: "xyz"
  };

  SourceService.getAllSources(true).success(function(sources) {
    $scope.sources = sources;
  });

  $scope.$watch('cache.geometry', function(geometry) {
    if (!geometry) {
      $scope.north = null;
      $scope.south = null;
      $scope.west = null;
      $scope.east = null;
      return;
    }

    var extent = turf.extent(geometry);
    $scope.north = extent[3];
    $scope.south = extent[1];
    $scope.west = extent[0];
    $scope.east = extent[2];
  });

  $scope.$watch('cache.source', function(source) {
    if (source && source.format == 'geotiff') {
      $scope.cache.source.url = null;
      if (!source.geometry) {
        $scope.north = null;
        $scope.south = null;
        $scope.west = null;
        $scope.east = null;
        return;
      }
      var geometry = source.geometry;
      while(geometry.type != "Polygon" && geometry != null){
        geometry = geometry.geometry;
      }
      $scope.cache.geometry = geometry;
    }
  });

  $scope.createCache = function() {
    console.log($scope.cache);
    $scope.creatingCache = true;
    CacheService.createCache($scope.cache, function(cache) {
      $scope.creatingCache = false;
      presentModal(cache);
    }, function(error, status) {
      $scope.cacheCreationError = {error: error, status: status};
    });
  }

  $scope.createSource = function() {
    $location.path('/source');
  }

  function presentModal(cache) {
    var modalInstance = $modal.open({
      backdrop: 'static',
      templateUrl: 'app/mapcache/cache-creation-success.html',
      controller: ['$scope', '$modalInstance', '$location', 'UserService', function ($scope, $modalInstance, $location, UserService) {
        var oldUsername = UserService.myself && UserService.myself.username || undefined;
        $scope.user = UserService.myself;
        $scope.cache = cache;
        $scope.createAnotherCache = function() {
          $modalInstance.dismiss('another');
        }

        $scope.returnToList = function () {
          $modalInstance.dismiss('done');
          $location.path('/mapcache');
        };
      }]
    });

    modalInstance.result.then(function () {
    });
  }
};

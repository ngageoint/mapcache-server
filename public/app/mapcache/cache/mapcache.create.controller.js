angular
  .module('mapcache')
  .controller('MapcacheCreateController', MapcacheCreateController);

MapcacheCreateController.$inject = [
  '$scope',
  '$location',
  '$routeParams',
  '$modal',
  'CacheService',
  'SourceService'
];

function MapcacheCreateController($scope, $location, $routeParams, $modal, CacheService, SourceService) {

  $scope.currentAdminPanel = $routeParams.adminPanel || "user";

  var seenCorners;

  $scope.cache = {
    format: "xyz"
  };

  SourceService.getAllSources(true).success(function(sources) {
    $scope.sources = sources;
    if ($routeParams.sourceId) {
      for (var i = 0; i < $scope.sources.length && $scope.cache.source == null; i++) {
        if ($routeParams.sourceId == $scope.sources[i].id) {
          $scope.cache.source = $scope.sources[i];
        }
      }
    }
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
    if (!source.geometry) {
      $scope.north = null;
      $scope.south = null;
      $scope.west = null;
      $scope.east = null;
      $scope.cache.geometry = null;
      return;
    }
    if (source && source.format == 'geotiff') {
      var geometry = source.geometry;
      while(geometry.type != "Polygon" && geometry != null){
        geometry = geometry.geometry;
      }
      $scope.cache.geometry = geometry;
    }
  });

  $scope.requiredFieldsSet = function() {
    var zoomValidated = false;
    if (isNaN($scope.cache.minZoom) || isNaN($scope.cache.maxZoom) || $scope.cache.maxZoom === null || $scope.cache.minZoom === null) {
      zoomValidated = false;
    } else if ($scope.cache.minZoom === 0 && $scope.cache.maxZoom === 0) {
      zoomValidated = true;
    } else if ($scope.cache.minZoom === 0 && $scope.cache.maxZoom > 0) {
      zoomValidated = true;
    } else if ($scope.cache.maxZoom >= $scope.cache.minZoom) {
      zoomValidated = true;
    }
    return $scope.cache.geometry && $scope.cache.name && $scope.cache.source && zoomValidated;
  }

  $scope.createCache = function() {
    console.log($scope.cache);
    $scope.creatingCache = true;
    $scope.cacheCreationError = null;
    CacheService.createCache($scope.cache, function(cache) {
      $scope.creatingCache = false;
      $location.path('/cache/'+cache.id);
    }, function(error, status) {
      $scope.creatingCache = false;
      $scope.cacheCreationError = {error: error, status: status};
    });
  }

  $scope.createSource = function() {
    $location.path('/source');
  }

};

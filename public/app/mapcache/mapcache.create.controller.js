angular
  .module('mapcache')
  .controller('MapcacheCreateController', MapcacheCreateController);

MapcacheCreateController.$inject = [
  '$scope',
  '$location',
  'CacheService',
  'SourceService'
];

function MapcacheCreateController($scope, $location, CacheService, SourceService) {

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

  // $scope.$watch('north+south+east+west', function(corners, oldCorners) {
  //   console.log('corners', corners);
  //   console.log('old corners', oldCorners);
  //   console.log('seen corners', seenCorners);
  //   console.log('seen corners == corners', seenCorners == corners);
  //   if (seenCorners == corners) return;
  //   seenCorners = corners;
  //   var coordinateCorners = [];
  //   coordinateCorners.push([$scope.north, $scope.east], [$scope.north, $scope.west], [$scope.south, $scope.east], [$scope.south, $scope.west], [$scope.north, $scope.east]);
  //
  //   var polygon = turf.polygon([coordinateCorners]);
  //   $scope.cache.geometry = polygon;
  // });

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


      $scope.cache.geometry = source.geometry;
      // $scope.north = extent[3];
      // $scope.south = extent[1];
      // $scope.west = extent[0];
      // $scope.east = extent[2];
    }
  });

  $scope.createCache = function() {
    console.log($scope.cache);
    CacheService.createCache($scope.cache);
  }

  $scope.createSource = function() {
    $location.path('/source');
  }
};

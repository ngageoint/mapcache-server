var _ = require('underscore');
var config = require('../../config');
module.exports = function MapController($scope, $location, $timeout, $routeParams, $rootScope, $filter, CacheService, MapService, LocalStorageService) {

  $scope.token = LocalStorageService.getToken();
  $scope.mapOptions = {
    baseLayerUrl: config.defaultMapLayer,
    opacity: 0.14
  };

  $rootScope.title = 'Map';
  $scope.map = {
    id: $routeParams.mapId
  };

  var allCaches;

  $scope.createCacheFromMap = function() {
    $location.path('/create/'+$routeParams.mapId);
  };

  $scope.$on('cacheFilterChange', function(event, filter) {
    $scope.caches = $filter('filter')($filter('filter')(allCaches, filter.cacheFilter), filter.mapFilter);
  });

  $scope.$on('generateFormat', function(event, cache, format) {
    CacheService.createCacheFormat(cache, format, function() {
      cache.formats = cache.formats || {};
      cache.formats[format] = cache.formats[format] || {};
      cache.formats[format].generating = true;
      getCaches();
    });
  });

  function getCaches() {
    MapService.getCachesForMap($scope.map, function(caches) {
      allCaches = caches;
      $scope.caches = caches;

      var currentlyGenerating = false;
      for (var i = 0; i < caches.length && !currentlyGenerating; i++) {
        var cache = caches[i];
        for (var format in cache.formats) {
          if (!cache.formats[format].complete) {
            currentlyGenerating = true;
          }
        }
      }
      var delay = currentlyGenerating ? 30000 : 300000;
      $timeout(getCaches, delay);

    });
  }

  $scope.mapComplete = false;

  function getMap() {
    MapService.getMap($scope.map, function(map) {
      // success
      $scope.map = map;
      $rootScope.title = map.name;
      if (_.some(map.dataSources, function(value) {
        return !value.status.complete; })) {
        $scope.mapComplete = false;
        $timeout(getMap, 5000);
      } else {
        $scope.mapComplete = true;
        getCaches();
        if (_.some(map.dataSources, function(value) {
          return value.vector; })) {
          $scope.mapOptions.opacity = 1;
          $scope.map.style = $scope.map.style || {styles:[], defaultStyle: {style: {}}};
        }
      }
    }, function() {
      // error
    });
  }

  getMap();
};

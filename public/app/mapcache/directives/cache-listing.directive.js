angular
  .module('mapcache')
  .directive('cacheListing', cacheListing);

function cacheListing() {
  var directive = {
    restrict: "A",
    replace: true,
    templateUrl: 'app/mapcache/directives/cache-listing.html',
    scope: {
      map: '=',
      options: '=',
      caches: '='
    },
    controller: CacheListingController
  };

  return directive;
}

CacheListingController.$inject = ['$scope', '$rootScope', '$timeout', 'LocalStorageService', 'TileUtilities'];

function CacheListingController($scope, $rootScope, $timeout, LocalStorageService, TileUtilities) {

  $scope.token = LocalStorageService.getToken();
  $scope.options.opacity = $scope.options.opacity || .14;
  $scope.options.baseLayerUrl = $scope.options.baseLayerUrl || 'http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png';

  var cacheHighlightPromise;
  $scope.mouseOver = function(cache) {
    $rootScope.$broadcast('showCacheExtent', cache);
    if (cacheHighlightPromise) {
      $timeout.cancel(cacheHighlightPromise);
    }
    cacheHighlightPromise = $timeout(function() {
      $rootScope.$broadcast('showCache', cache);
    }, 500);
  }

  $scope.mouseOut = function(cache) {
    $rootScope.$broadcast('hideCacheExtent', cache);

    if (cacheHighlightPromise) {
      $timeout.cancel(cacheHighlightPromise);
      cacheHighlightPromise = undefined;
    }
    $rootScope.$broadcast('hideCache', cache);
  }

  $rootScope.$on('cacheFootprintPopupOpen', function(event, cache) {
    $scope.mapFilter = cache.id;
  });

  $rootScope.$on('cacheFootprintPopupClose', function(event, cache) {
    $scope.mapFilter = null;
  });

  $scope.$watch('cacheFilter+mapFilter', function(filter) {
    $scope.$emit('cacheFilterChange', {cacheFilter: $scope.cacheFilter, mapFilter: $scope.mapFilter});
  });

  $scope.getOverviewTilePath = TileUtilities.getOverviewTilePath;

  $scope.featureProperties = [];

  $scope.createCacheFromMap = function() {
    $location.path('/create/'+$routeParams.mapId);
  }

  $scope.$watch('map.previewLayer', function(layer, oldLayer) {
    if (layer) {
      if (layer.EX_GeographicBoundingBox) {
        $scope.mapOptions.extent = layer.EX_GeographicBoundingBox;
      }
    }
  });
}

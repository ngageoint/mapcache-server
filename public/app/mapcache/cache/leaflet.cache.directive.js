angular
  .module('mapcache')
  .directive('leafletCache', leafletCache);

function leafletCache() {
  var directive = {
    restrict: "A",
    replace: true,
    template: '<div style="height: 500px;"></div>',
    scope: {
      cache: '=',
      options: '='
    },
    controller: LeafletCacheController
  };

  return directive;
}

LeafletCacheController.$inject = ['$scope', '$element', 'LocalStorageService'];

function LeafletCacheController($scope, $element, LocalStorageService) {

  var baseLayerOptions = $scope.options || {
    maxZoom: 18,
    tms: false,
    opacity: 1
  };

  var cacheLayerOptions = {
    maxZoom: 18,
    tms: false,
    opacity: 1
  };

  var defaultLayer = baseLayerOptions.baseLayerUrl;

  var baseLayer = L.tileLayer(defaultLayer, baseLayerOptions);
  var cacheLayer = null;

  $scope.$watch('cache', function(cache, oldCache) {
    if (cache == oldCache) return;
    var map = L.map($element[0], {
      center: [45,0],
      zoom: 0,
      minZoom: cache.minZoom,
      maxZoom: cache.maxZoom
    });

    baseLayer.addTo(map);
    cacheLayerOptions.tms = 'tms' == cache.source.format;
    if (cacheLayer) {
      map.removeLayer(cacheLayer);
    }
    cacheLayer = L.tileLayer(getUrl($scope.cache), cacheLayerOptions);
    cacheLayer.addTo(map);
    var extent = turf.extent(cache.geometry);
    map.fitBounds([
      [extent[1],extent[0]],
      [extent[3], extent[2]]
    ]);
  });

  function getUrl(cache) {
    console.log('changing cache to ', cache);
    if (cache == null) {
      return defaultLayer;
    } else if (typeof cache == "string") {
      return cache + "/{z}/{x}/{y}.png";
    } else {
      return '/api/caches/'+ cache.id + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken();
    }
  }
}

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

LeafletCacheController.$inject = ['$scope', '$element', 'LocalStorageService', 'CacheService'];

function LeafletCacheController($scope, $element, LocalStorageService, CacheService) {

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
    if (oldCache && oldCache.status.complete) return;
    if (cache == oldCache) return;
    if (!cache.status.complete) return;
    var map = L.map($element[0], {
      center: [45,0],
      zoom: 3,
      minZoom: cache.source.vector ? 0 : cache.minZoom,
      maxZoom: cache.source.vector ? 18 : cache.maxZoom
    });
    map.addControl(new L.Control.ZoomIndicator());

    baseLayer.addTo(map);
    cacheLayerOptions.tms = 'tms' == cache.source.format;
    cacheLayerOptions.maxZoom = cache.source.vector ? 18 : cache.maxZoom;
    cacheLayerOptions.minZoom = cache.source.vector ? 0 : cache.minZoom;
    if (cacheLayer) {
      map.removeLayer(cacheLayer);
    }
    cacheLayer = getTileLayer(cache);
    cacheLayer.addTo(map);
    var extent = turf.extent(cache.geometry);
    console.log('extent', extent);
    map.fitBounds([
      [extent[1],extent[0]],
      [extent[3], extent[2]]
    ]);
  });

  function styleFunction(feature) {
    return LeafletUtilities.styleFunction(feature, $scope.cache.style);
  }

  function pointToLayer(feature, latlng) {
    return L.circleMarker(latlng, {radius: 3});
  }

  function getTileLayer(cache) {
    console.log('changing cache to ', cache);
    if (cache == null) {
      return L.tileLayer(defaultLayer, cacheLayerOptions);
    } else if (cache.source.vector) {
      var gj = L.geoJson(cache.data, {
        style: styleFunction,
        pointToLayer: pointToLayer,
        onEachFeature: function(feature, layer) {
          LeafletUtilities.popupFunction(feature, layer, $scope.source.style);
        }
      });
      CacheService.getCacheData(cache, 'geojson', function(data) {
        $scope.cache.data = data;
        // $scope.options.extent = turf.extent(data);
        gj.addData(data);
      });

      return gj;
    } else if (typeof source == "string") {
      return L.tileLayer(cache + "/{z}/{x}/{y}.png", options);
    } else {
      return L.tileLayer('/api/caches/'+ cache.id + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken(), cacheLayerOptions);
    }
  }
}

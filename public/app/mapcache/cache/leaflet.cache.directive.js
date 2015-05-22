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
    if (cache == oldCache) return;
    if (!cache.status.complete) return;
    var map = L.map($element[0], {
      center: [45,0],
      zoom: 3,
      minZoom: cache.source.format == 'shapefile' ? 0 : cache.minZoom,
      maxZoom: cache.source.format == 'shapefile' ? 18 : cache.maxZoom
    });
    map.addControl(new L.Control.ZoomIndicator());

    baseLayer.addTo(map);
    cacheLayerOptions.tms = 'tms' == cache.source.format;
    cacheLayerOptions.maxZoom = cache.source.format == 'shapefile' ? 18 : cache.maxZoom;
    cacheLayerOptions.minZoom = cache.source.format == 'shapefile' ? 0 : cache.minZoom;
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
    if (!$scope.cache.source.style) return {};
    var sorted = _.sortBy($scope.cache.source.style, 'priority');
    for (var i = 0; i < sorted.length; i++) {
      var styleProperty = sorted[i];
      var key = styleProperty.key;
      if (feature.properties && feature.properties[key]) {
        if (feature.properties[key] == styleProperty.value) {
          return {
            color: styleProperty.style['stroke'],
            fillOpacity: styleProperty.style['fill-opacity'],
            opacity: styleProperty.style['stroke-opacity'],
            weight: styleProperty.style['stroke-width'],
            fillColor: styleProperty.style['fill']
          };
        }
      }
    }
    var defaultStyle = _.find($scope.cache.source.style, function(style) {
      return !style.key;
    });

    return {
      color: defaultStyle.style['stroke'],
      fillOpacity: defaultStyle.style['fill-opacity'],
      opacity: defaultStyle.style['stroke-opacity'],
      weight: defaultStyle.style['stroke-width'],
      fillColor: defaultStyle.style['fill']
    }
  }

  function getTileLayer(cache) {
    console.log('changing cache to ', cache);
    if (cache == null) {
      return L.tileLayer(defaultLayer, cacheLayerOptions);
    } else if (cache.source.format == 'shapefile') {
      var gj = L.geoJson(cache.data, {
        style: styleFunction
      });
      CacheService.getCacheData(cache, function(data) {
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

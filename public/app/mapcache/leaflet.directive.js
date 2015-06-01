angular
  .module('mapcache')
  .directive('leaflet', leaflet);

function leaflet() {
  var directive = {
    restrict: "A",
    replace: true,
    template: '<div class="leaflet-map"></div>',
    controller: LeafletController,
    bindToController: true
  };

  return directive;
}

LeafletController.$inject = ['$rootScope', '$scope', '$interval', '$filter', '$element', 'CacheService', 'LeafletUtilities', 'LocalStorageService'];

function LeafletController($rootScope, $scope, $interval, $filter, $element, CacheService, LeafletUtilities, LocalStorageService) {
  var layers = {};
  var cacheFootprints = {};

  var map = L.map($element[0], {
    center: [45,0],
    zoom: 3,
    minZoom: 0,
    maxZoom: 18,
    worldCopyJump: true
  });
  map.addControl(new L.Control.ZoomIndicator());
  var loadingControl = L.Control.loading({
    separate: true
  });
  map.addControl(loadingControl);

  var baseLayer = L.tileLayer('http://mapbox.geointapps.org:2999/v4/mapbox.light/{z}/{x}/{y}.png');
  baseLayer.addTo(map);

  $scope.$watch('caches', function(caches) {
    if (!caches) return;
    // This is not optimal
    for (var cacheId in cacheFootprints) {
      var rectangle = cacheFootprints[cacheId];
      rectangle.setStyle({fillColor: "#333333", color: "#333333"});
    }
    for (var i = 0; i < caches.length; i++) {
      var cache = caches[i];
      createRectangle(cache, "#0072c5");
    }
  });

  $rootScope.$on('cacheHighlight', function(event, cache) {
    createRectangle(cache, "#ff7800");
  });

  $rootScope.$on('cacheUnhighlight', function(event, cache) {
    createRectangle(cache, "#0072c5");
  });

  $rootScope.$on('showCacheTiles', function(event, cache) {
    showCacheTiles(cache);
  });

  $rootScope.$on('hideCacheTiles', function(event, cache) {
    removeCacheTiles(cache);
  });

  $rootScope.$on('cacheFilterChange', function(event, filter) {
    CacheService.getAllCaches().success(function(caches) {
      $scope.caches = $filter('filter')($filter('filter')(caches, filter.cacheFilter), filter.mapFilter);
    });
  });

  function createRectangle(cache, color) {
    var rectangle = cacheFootprints[cache.id];
    if (rectangle) {
      rectangle.setStyle({fillColor: color, color: color});
      return;
    }

    var gj = L.geoJson(cache.geometry);
    gj.setStyle({fill: false, color: color});
    gj.bindPopup("<h5>" + cache.name + "</h5>");
    gj.on('popupopen', function(e) {
      $rootScope.$broadcast('cacheFootprintPopupOpen', cache);
      $scope.$apply();
    });
    gj.on('popupclose', function(e) {
      $rootScope.$broadcast('cacheFootprintPopupClose', cache);
      $scope.$apply();
    });
    gj.addTo(map);
    cacheFootprints[cache.id] = gj;
  }



  function showCacheTiles(cache) {
    removeCacheTiles(cache);
    if (cache.vector) {

      var gj = L.geoJson(cache.data, {
        // style: styleFunction,
        pointToLayer: function (feature, latlng) {
          return L.circleMarker(latlng, {radius: 3});
        },
        onEachFeature: function(feature, layer) {
          LeafletUtilities.popupFunction(feature, layer, cache.style);
        }
      });
      if (!cache.data) {
        console.log('go get the data');
        map.fireEvent('dataloading');
        CacheService.getCacheData(cache, 'geojson', function(data) {
          console.log('data is', data);
          gj.addData(data);
          gj.setStyle(function (feature) {
            return LeafletUtilities.styleFunction(feature, cache.style);
          });
          map.fireEvent('dataload');
        });
      }
      baseLayer.setOpacity(.5);
      layers[cache.id] = gj;
      gj.addTo(map);
    } else {
      baseLayer.setOpacity(.5);
      var layer = L.tileLayer("/api/caches/"+ cache.id + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken());
      layers[cache.id] = layer;
      layer.addTo(map);
    }
  }

  function removeCacheTiles(cache) {
    console.log('layers', layers);
    var layer = layers[cache.id];
    if (layer) {
      map.removeLayer(layer);
      delete layers[cache.id];
    }
    console.log('new layers', layers);
    if (Object.keys(layers).length == 0) {
      baseLayer.setOpacity(1);
    }
  }
}

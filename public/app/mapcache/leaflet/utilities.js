var LeafletUtilities = (function() {

  return {
    styleFunction: styleFunction,
    popupFunction: popupFunction
  };

  function styleFunction(feature, style) {
    if (!style) return {};

    if (style.styles) {
      var sorted = _.sortBy(style.styles, 'priority');
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
    }
    var defaultStyle = style.defaultStyle;
    if (!defaultStyle) {
      return {};
    }

    return {
      color: defaultStyle.style['stroke'],
      fillOpacity: defaultStyle.style['fill-opacity'],
      opacity: defaultStyle.style['stroke-opacity'],
      weight: defaultStyle.style['stroke-width'],
      fillColor: defaultStyle.style['fill']
    }
  }

  function popupFunction(feature, layer, style) {
    if (style && (style.title || style.description)) {
      var title = "";
      if (style.title && feature.properties && feature.properties[style.title]) {
        title = feature.properties[style.title];
      }
      var description = "";
      if (style.description && feature.properties && feature.properties[style.description]) {
        description = feature.properties[style.description];
      }
      layer.bindPopup(title + " " + description);
    }
  }
})();

// leaflet.create
function getTileLayer(source) {
  console.log('changing source to ', source);
  if (source == null) {
    return L.tileLayer(defaultLayer, options);
  } else if (source.vector) {
    var gj = L.geoJson(source.data, {
      style: styleFunction
    });
    SourceService.getSourceData(source, function(data) {
      $scope.options.source.data = data;
      $scope.options.extent = turf.extent(data);
      gj.addData(data);
    });

    return gj;
  } else if (typeof source == "string") {
    return L.tileLayer(source + "/{z}/{x}/{y}.png", options);
  } else if (source.id) {
    var url = '/api/sources/'+ source.id + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken();
    if (source.previewLayer) {
      url += '&layer=' + source.previewLayer.Name;
    }
    return L.tileLayer(url, options);
  } else if (source.format == "wms") {
    if (source.wmsGetCapabilities && source.previewLayer) {
      return L.tileLayer.wms(source.url, {
        layers: source.previewLayer.Name,
        version: source.wmsGetCapabilities.version,
        transparent: !source.previewLayer.opaque
      });
    }
  }
}
// leaflet.cache
function getTileLayer(cache) {
  console.log('changing cache to ', cache);
  if (cache == null) {
    return L.tileLayer(defaultLayer, cacheLayerOptions);
  } else if (cache.source.vector) {
    var gj = L.geoJson(cache.data, {
      style: styleFunction
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






















//leaflet.source
function getTileLayer(source) {
  console.log('changing source to ', source);
  if (source == null) {
    return L.tileLayer(defaultLayer, sourceLayerOptions);
  } else if (source.vector) {
    if (!source.data) return;
    var gj = L.geoJson(source.data, {
      style: styleFunction,
      pointToLayer: pointToLayer,
      onEachFeature: function(feature, layer) {
        LeafletUtilities.popupFunction(feature, layer, $scope.source.style);
      }
    });

    return gj;
  } else if (typeof source == "string") {
    return L.tileLayer(source + "/{z}/{x}/{y}.png", sourceLayerOptions);
  } else if (source.id) {
    var url = '/api/sources/'+ source.id + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken();
    if (source.previewLayer) {
      url += '&layer=' + source.previewLayer.Name;
    }
    return L.tileLayer(url, sourceLayerOptions);
  } else if (source.format == "wms") {
    if (source.wmsGetCapabilities && source.previewLayer) {
      return L.tileLayer.wms(source.url, {
        layers: source.previewLayer.Name,
        version: source.wmsGetCapabilities.version,
        transparent: !source.previewLayer.opaque
      });
    }
  } else if (!source.id && source.url) {
    return L.tileLayer(source.url + "/{z}/{x}/{y}.png", sourceLayerOptions);
  }
}

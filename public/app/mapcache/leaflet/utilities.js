angular
  .module('mapcache')
  .factory('LeafletUtilities', LeafletUtilities);

LeafletUtilities.$inject = ['LocalStorageService'];

function LeafletUtilities(LocalStorageService) {

  return {
    styleFunction: styleFunction,
    popupFunction: popupFunction,
    tileLayer: tileLayer
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

  function pointToLayer(feature, latlng) {
    return L.circleMarker(latlng, {radius: 3});
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

  function tileLayer(layerSource, defaultLayer, layerOptions, style, styleFunction) {
    if (layerSource == null) {
      return L.tileLayer(defaultLayer, layerOptions);
    } else if (layerSource.vector) {
      if (!layerSource.data) return;
      var gj = L.geoJson(layerSource.data, {
        style: styleFunction,
        pointToLayer: pointToLayer,
        onEachFeature: function(feature, layer) {
          popupFunction(feature, layer, style);
        }
      });
      return gj;
    } else if (typeof layerSource == "string") {
      return L.tileLayer(layerSource + "/{z}/{x}/{y}.png", layerOptions);
    } else if (layerSource.mapcacheUrl) {
      var url = layerSource.mapcacheUrl + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken();
      if (layerSource.previewLayer) {
        url += '&layer=' + layerSource.previewLayer.Name;
      }
      return L.tileLayer(url, layerOptions);
    } else if (layerSource.format == 'wms') {
      if (layerSource.wmsGetCapabilities && layerSource.previewLayer) {
        return L.tileLayer.wms(layerSource.url, {
          layers: layerSource.previewLayer.Name,
          version: layerSource.wmsGetCapabilities.version,
          transparent: !layerSource.previewLayer.opaque
        });
      }
    }else if (layerSource.url) {
      console.log('layersource.url', layerSource.url);
      var url = layerSource.url + "/{z}/{x}/{y}.png";
      if (layerSource.previewLayer) {
        url += '&layer=' + source.previewLayer.Name;
      }
      return L.tileLayer(url, layerOptions);
    }
  }
};

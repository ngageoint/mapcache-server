angular
  .module('mapcache')
  .factory('LeafletUtilities', LeafletUtilities);

LeafletUtilities.$inject = ['LocalStorageService', 'MapService'];

function LeafletUtilities(LocalStorageService, MapService) {

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
      fillOpacity: 0,//defaultStyle.style['fill-opacity'],
      opacity: defaultStyle.style['stroke-opacity'],
      weight: defaultStyle.style['stroke-width'],
      fillColor: defaultStyle.style['fill']
    }
  }

  function pointToLayer(feature, latlng) {
    return L.circleMarker(latlng, {radius: 3});
  }

  function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
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
    console.log('layerSource', layerSource);
    if (layerSource == null) {
      return L.tileLayer(defaultLayer, layerOptions);
    } else if (layerSource.vector) {
      var url = layerSource.mapcacheUrl + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken()+"&_dc="+layerSource.styleTime;
      if (layerSource.wmsLayer) {
        url += '&layer=' + layerSource.wmsLayer.Name;
      }
      var layer = L.tileLayer(url, layerOptions);
      return layer;
    } else if (typeof layerSource == "string") {
      return L.tileLayer(layerSource + "/{z}/{x}/{y}"+ (layerSource.tilesLackExtensions ? "" : ".png"), layerOptions);
    } else if (layerSource.mapcacheUrl) {
      var url = layerSource.mapcacheUrl + "/{z}/{x}/{y}"+ (layerSource.tilesLackExtensions ? "" : ".png") +"?access_token=" + LocalStorageService.getToken();
      if (layerSource.wmsLayer) {
        url += '&layer=' + layerSource.wmsLayer.Name;
      }
      return L.tileLayer(url, layerOptions);
    } else if (layerSource.format == 'wms') {
      if (layerSource.wmsGetCapabilities && layerSource.wmsLayer) {
        return L.tileLayer.wms(layerSource.url, {
          layers: layerSource.wmsLayer.Name,
          version: layerSource.wmsGetCapabilities.version,
          transparent: !layerSource.wmsLayer.opaque,
          format: layerSource.wmsLayer.opaque ? 'image/jpeg' : 'image/png'
        });
      }
    } else if (layerSource.format == 'arcgis') {
      return L.tileLayer(layerSource.wmsGetCapabilities.tileServers[0] + "/tile/{z}/{y}/{x}", layerOptions);
    } else if (layerSource.url) {
      console.log('layersource.url', layerSource.url);
      var url = layerSource.url + "/{z}/{x}/{y}"+ (layerSource.tilesLackExtensions ? "" : ".png");
      if (layerSource.wmsLayer) {
        url += '&layer=' + source.wmsLayer.Name;
      }
      return L.tileLayer(url, layerOptions);
    }
  }
};

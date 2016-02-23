var _ = require('underscore');
var L = require('leaflet');
module.exports = function LeafletUtilities(LocalStorageService) {

  return {
    styleFunction: styleFunction,
    popupFunction: popupFunction,
    tileLayer: tileLayer,
    addDatasourcesToLayerControl: addDatasourcesToLayerControl
  };

  function styleFunction(feature, style) {
    if (!style) return {};

    if (style.styles) {
      var sorted = _.sortBy(style.styles, 'priority');
      for (var i = 0; i < sorted.length; i++) {
        var styleProperty = sorted[i];
        var key = styleProperty.key;
        if (feature.properties && feature.properties[key]) {
          if (feature.properties[key] === styleProperty.value) {
            return {
              color: styleProperty.style.stroke,
              fillOpacity: styleProperty.style['fill-opacity'],
              opacity: styleProperty.style['stroke-opacity'],
              weight: styleProperty.style['stroke-width'],
              fillColor: styleProperty.style.fill
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
      color: defaultStyle.style.stroke,
      fillOpacity: defaultStyle.style['fill-opacity'],
      opacity: defaultStyle.style['stroke-opacity'],
      weight: defaultStyle.style['stroke-width'],
      fillColor: defaultStyle.style.fill
    };
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

  function addDatasourcesToLayerControl(dataSources, layerControl, map) {
    _.each(dataSources, function(ds) {
      var marker = L.marker([0,0]);
      marker.dataSource = ds;
      marker.addTo(map);
      layerControl.addOverlay(marker, ds.name);
    });
  }

  function tileLayer(layerSource, defaultLayer, layerOptions, style, styleFunction, dataSources) {
    var url;
    if (!layerSource) {
      return L.tileLayer(defaultLayer, layerOptions);
    } else if (typeof layerSource === "string") {
      return L.tileLayer(layerSource + "/{z}/{x}/{y}", layerOptions);
    } else if (layerSource.mapcacheUrl) {
      url = layerSource.mapcacheUrl + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken()+"&_dc="+layerSource.styleTime;
      if (dataSources && dataSources.length) {
        _.each(dataSources, function(ds) {
          url += '&dataSources[]=' + ds.id;
        });
      }
      return L.tileLayer(url, layerOptions);
    } else if (layerSource.format === 'wms') {
      if (layerSource.metadata && layerSource.metadata.wmsGetCapabilities && layerSource.metadata.wmsLayer) {
        var options = {
          layers: layerSource.metadata.wmsLayer.Name,
          version: layerSource.metadata.wmsGetCapabilities.version,
          transparent: !layerSource.metadata.wmsLayer.opaque,
          format: layerSource.metadata.wmsLayer.opaque ? 'image/jpeg' : 'image/png'
        };
        for(var k in layerOptions) options[k]=layerOptions[k];
        return L.tileLayer.wms(layerSource.url, options);
      } else {
        return L.tileLayer(defaultLayer, layerOptions);
      }
    } else if (layerSource.format === 'arcgis') {
      return L.tileLayer(layerSource.metadata.wmsGetCapabilities.tileServers[0] + "/tile/{z}/{y}/{x}", layerOptions);
    } else if (layerSource.url) {
      url = layerSource.url + "/{z}/{x}/{y}"+ (layerSource.tilesLackExtensions ? "" : ".png");
      if (layerSource.metadata && layerSource.metadata.wmsLayer) {
        url += '&layer=' + layerSource.metadata.wmsLayer.Name;
      }
      return L.tileLayer(url, layerOptions);
    }
    return L.tileLayer(defaultLayer, layerOptions);
  }
};

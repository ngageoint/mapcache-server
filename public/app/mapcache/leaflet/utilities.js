angular
  .module('mapcache')
  .factory('LeafletUtilities', LeafletUtilities);

LeafletUtilities.$inject = ['LocalStorageService', 'SourceService'];

function LeafletUtilities(LocalStorageService, SourceService) {

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
    if (layerSource == null) {
      return L.tileLayer(defaultLayer, layerOptions);
    } else if (layerSource.vector) {

      // var canvasLayer = L.tileLayer.canvas({async: true});
      // canvasLayer.drawTile = function(canvas, tilePoint, zoom) {
      //   var ctx = canvas.getContext('2d');
      //   SourceService.getSourceVectorTile(layerSource, zoom, tilePoint.x, tilePoint.y, function(data, status) {
      //     console.log('data', data);
      //     var features = data.features;
      //     for (var i = 0; i < features.length; i++) {
      //       var feature = features[i], typeChanged = type !== feature.type,
      //         type = feature.type;
      //       ctx.beginPath();
      //       for (var j = 0; j < feature.geometry.length; j++) {
      //         var ring = feature.geometry[j];
      //         for (var k = 0; k < ring.length; k++) {
      //           var p = ring[k];
      //           if (k) ctx.lineTo(p[0] / 16.0, p[1] / 16.0);
      //           else ctx.moveTo(p[0] / 16.0, p[1] / 16.0);
      //         }
      //       }
      //       var styles = styleFunction(feature);
      //       var rgbFill = hexToRgb(styles.fillColor);
      //       ctx.fillStyle = "rgba("+rgbFill.r+","+rgbFill.g+","+rgbFill.b+","+styles.fillOpacity+")";
      //       ctx.lineWidth = styles.weight;
      //       var rgbStroke = hexToRgb(styles.color);
      //       ctx.strokeStyle = "rgba("+rgbStroke.r+","+rgbStroke.g+","+rgbStroke.b+","+styles.opacity+")";
      //
      //       if (type === 3) ctx.fill('evenodd');
      //       ctx.stroke();
      //
      //       /*
      //
      //       */
      //     }
      //     canvasLayer.tileDrawn(canvas);
      //   });
      // };
      // return canvasLayer;

      // if (!layerSource.data) {
        var url = layerSource.mapcacheUrl + "/{z}/{x}/{y}.png?access_token=" + LocalStorageService.getToken()+"&_dc="+Date.now();
        if (layerSource.previewLayer) {
          url += '&layer=' + layerSource.previewLayer.Name;
        }
        var layer = L.tileLayer(url, layerOptions);
        return layer;
      // } else {
      //   var gj = L.geoJson(layerSource.data, {
      //     style: styleFunction,
      //     pointToLayer: pointToLayer,
      //     onEachFeature: function(feature, layer) {
      //       popupFunction(feature, layer, style);
      //     }
      //   });
      //   return gj;
      // }
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
          transparent: !layerSource.previewLayer.opaque,
          format: layerSource.previewLayer.opaque ? 'image/jpeg' : 'image/png'
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

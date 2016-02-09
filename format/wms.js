var request = require('request')
  , xyzTileUtils = require('xyz-tile-utils')
  , turf = require('turf')
  , proj4 = require('proj4');

var WMS = function(config) {
  config = config || {};
  this.source = config.source;
  console.log('setting this as the source', this.source);
  if (config.cache) {
    throw new Error('cannot create a WMS cache at this time');
  }
};

WMS.prototype.initialize = function() {
};

WMS.prototype.processSource = function(doneCallback, progressCallback) {
  var self = this;
  doneCallback = doneCallback || function() {};
  progressCallback = progressCallback || function(source, callback) { callback(null, source);};
  this.source.status = {};
  this.source.status.message = "Parsing GetCapabilities";
  this.source.status.complete = false;
  progressCallback(this.source, function(err, updatedSource) {
    self.source = updatedSource;

    console.log('getting wms get capabilities');
    self._getWmsGetCapabilities(function(){
      var wmsGetCapabilities = self.source.metadata.wmsGetCapabilities;
      console.log('self.source.wmsLayer', self.source.wmsLayer);
      if (self.source.metadata.wmsLayer.Name && wmsGetCapabilities.Capability && wmsGetCapabilities.Capability.Layer && wmsGetCapabilities.Capability.Layer.Layer && Array.isArray(wmsGetCapabilities.Capability.Layer.Layer)) {
        var layerArray = wmsGetCapabilities.Capability.Layer.Layer;
        var layer;
        console.log('json', wmsGetCapabilities.Capability.Layer.Layer);
        for (var i = 0; i < layerArray.length && !layer; i++) {
          if (layerArray[i].Name === self.source.metadata.wmsLayer.Name) {
            layer = layerArray[i];
          }
        }
        self.setSourceLayer(layer, function(err, updatedSource) {
          self.source = updatedSource;
          self.source.status.message = "Complete";
          self.source.status.complete = true;
          doneCallback(null, self.source);
        });
      } else {
        self.source.status.message = "Complete";
        self.source.status.complete = true;
        doneCallback(null, self.source);
      }
    });
  });
};

WMS.prototype._getWmsGetCapabilities = function(callback) {
  var self = this;
  console.log('self.source.wmsGetCapabilities', !!self.source.metadata.wmsGetCapabilities);
  if (self.source.metadata.wmsGetCapabilities) {
    return callback();
  } else {
    global.DOMParser = require('xmldom').DOMParser;
    var WMSCapabilities = require('wms-capabilities');
    request.get({url: self.source.url + '?SERVICE=WMS&REQUEST=GetCapabilities'}, function(error, response, body) {
      var json = new WMSCapabilities(body).toJSON();
      self.source.metadata.wmsGetCapabilities = json;
      callback();
    });
  }
};

WMS.prototype.setSourceLayer = function(layer, callback) {
  this.source.metadata.wmsLayer = layer;
  var box;
  if (layer.EX_GeographicBoundingBox) { // jshint ignore:line
    box = layer.EX_GeographicBoundingBox; // jshint ignore:line
  } else if (layer.BoundingBox && Array.isArray(layer.BoundingBox)) {
    for (var i = 0; i < layer.BoundingBox.length && !box; i++) {
      if (layer.BoundingBox[i].crs === 'EPSG:4326') {
        box = layer.BoundingBox[i].extent;
      }
    }
  }
  box = box || [-180, -85, 180, 85];
  this.source.geometry = turf.polygon([[
    [box[0], box[1]],
    [box[0], box[3]],
    [box[2], box[3]],
    [box[2], box[1]],
    [box[0], box[1]]
  ]]);
  callback(null, this.source);
};

WMS.prototype.getTile = function(format, z, x, y, params, callback) {
  format = format.toLowerCase();
  if (format !== 'png' && format !== 'jpeg') return callback(null, null);
  if (params.layer === undefined || params.layer === null) {
    if (this.source.metadata.wmsLayer && this.source.metadata.wmsLayer.Name) {
      params.layer = this.source.metadata.wmsLayer.Name;
    } else {
      return callback(null);
    }
  }
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + this.source.name);

  var bbox = xyzTileUtils.tileBboxCalculator(x, y, z);
  var epsg3857ll = proj4('EPSG:3857', [bbox.west, bbox.south]);
  var epsg3857ur = proj4('EPSG:3857', [bbox.east, bbox.north]);

  var c = this.source.metadata.wmsGetCapabilities;
  var url = this.source.url + '?SERVICE=WMS&REQUEST=GetMap&STYLES=&VERSION=' + c.version + '&LAYERS=' + params.layer + '&FORMAT=image/png&TRANSPARENT=true&HEIGHT=256&WIDTH=256&SRS=EPSG:3857&CRS=EPSG:3857&BBOX=' + epsg3857ll[0] + ',' + epsg3857ll[1] + ',' + epsg3857ur[0] + ',' + epsg3857ur[1];

  var req = request.get({url: url})
  .on('error', function(err) {
    console.log(err+ url);

    // callback(err, null);
  });
  // .on('response', function(response) {
  //   var size = response.headers['content-length'];
  //   SourceModel.updateSourceAverageSize(source, size, function(err) {
  //   });
  // });
  callback(null, req);
};

WMS.prototype.generateCache = function(doneCallback) {
  doneCallback(null, null);
};

WMS.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  callback(null, []);
};

module.exports = WMS;

var CacheModel = require('../../models/cache')
  , SourceModel = require('../../models/source')
  , tu = require('../tileUtilities')
  , proj4 = require('proj4')
  , request = require('request');

exports.process = function(source, callback) {
  callback(null, source);
  var child = require('child_process').fork('api/sources/processor.js');
  child.send({operation:'process', sourceId: source._id});
}

exports.getTile = function(source, format, z, x, y, params, callback) {
  if (params.layer == undefined || params.layer == null) {
    if (source.wmsLayer && source.wmsLayer.Name) {
      params.layer = source.wmsLayer.Name;
    } else {
      return callback(null);
    }
  }
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + source.name);

  var bbox = tu.tileBboxCalculator(x, y, z);
  var epsg3857ll = proj4('EPSG:3857', [bbox.west, bbox.south]);
  var epsg3857ur = proj4('EPSG:3857', [bbox.east, bbox.north]);

  var c = source.wmsGetCapabilities;
  var url = source.url + '?SERVICE=WMS&REQUEST=GetMap&STYLES=&VERSION=' + c.version + '&LAYERS=' + params.layer + '&FORMAT=image/png&TRANSPARENT=true&HEIGHT=256&WIDTH=256&CRS=EPSG:3857&BBOX=' + epsg3857ll[0] + ',' + epsg3857ll[1] + ',' + epsg3857ur[0] + ',' + epsg3857ur[1];

  var req = request.get({url: url})
  .on('error', function(err) {
    console.log(err+ url);

    callback(err, null);
  })
  .on('response', function(response) {
    var size = response.headers['content-length'];
    SourceModel.updateSourceAverageSize(source, size, function(err) {
    });
  });
  callback(null, req);
}

exports.getData = function(source, callback) {
  callback(null);
}

exports.processSource = function(source, callback) {
  source.status.message = "Parsing GetCapabilities";
  source.status.complete = false;
  SourceModel.updateDatasource(source, function(err, updatedSource) {
    var DOMParser = global.DOMParser = require('xmldom').DOMParser;
    var WMSCapabilities = require('wms-capabilities');
    var req = request.get({url: updatedSource.url + '?SERVICE=WMS&REQUEST=GetCapabilities'}, function(error, response, body) {
      var json = new WMSCapabilities(body).toJSON();
      updatedSource.wmsGetCapabilities = json;
      updatedSource.status.message = "Complete";
      updatedSource.status.complete = true;
      SourceModel.updateDatasource(updatedSource, function(err, updatedSource) {
        callback(err);
      });
    });
  });
}

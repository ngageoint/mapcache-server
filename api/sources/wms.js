var CacheModel = require('../../models/cache')
  , SourceModel = require('../../models/source')
  , tu = require('../tileUtilities')
  , proj4 = require('proj4')
  , request = require('request');

exports.process = function(source, callback) {
  callback(null, source);
  var child = require('child_process').fork('api/sources/processor');
  child.send({operation:'process', sourceId: source.id});
}

exports.getTile = function(source, z, x, y, params, callback) {
  if (!params.layer) {
    callback(null);
  }
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + source.name);

  var bbox = tu.tileBboxCalculator(x, y, z);
  var epsg3857ll = proj4('EPSG:3857', [bbox.west, bbox.south]);
  var epsg3857ur = proj4('EPSG:3857', [bbox.east, bbox.north]);

  var c = source.wmsGetCapabilities;
  var url = source.url + '?SERVICE=WMS&REQUEST=GetMap&STYLES=&VERSION=' + c.version + '&LAYERS=' + params.layer + '&FORMAT=image/png&TRANSPARENT=true&HEIGHT=256&WIDTH=256&CRS=EPSG:3857&BBOX=' + epsg3857ll[0] + ',' + epsg3857ll[1] + ',' + epsg3857ur[0] + ',' + epsg3857ur[1];

  console.log('url', url);
  var req = request.get({url: url,
    headers: {'Content-Type': 'image/jpeg'},
  })
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
  source.status = "Parsing GetCapabilities";
  source.complete = false;
  source.save(function(err) {
    var DOMParser = global.DOMParser = require('xmldom').DOMParser;
    var WMSCapabilities = require('wms-capabilities');
    var req = request.get({url: source.url + '?SERVICE=WMS&REQUEST=GetCapabilities'}, function(error, response, body) {
      var json = new WMSCapabilities(body).toJSON();
      source.wmsGetCapabilities = json;
      source.status = "Complete";
      source.complete = true;
      source.save(function(err) {
        callback(err);
      });
    });
  });
}

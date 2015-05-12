var CacheModel = require('../../models/cache')
  , SourceModel = require('../../models/source')
  , tu = require('../tileUtilities')
  , proj4 = require('proj4')
  , request = require('request');

exports.createCache = function(cache) {
  var child = require('child_process').fork('api/sourceTypes/wmsProcessor');
  child.send({operation:'generateCache', cache: cache});
}

exports.process = function(source, callback) {
  callback(null, source);
  var child = require('child_process').fork('api/sourceTypes/wmsProcessor');
  child.send({operation:'process', sourceId: source.id});
}

exports.getTile = function(source, z, x, y, params, callback) {
  // http://demo.opengeo.org/geoserver/ows?SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0&LAYERS=nasa%3Abluemarble&STYLES=&FORMAT=image%2Fjpeg&TRANSPARENT=true&HEIGHT=256&WIDTH=256&CRS=EPSG%3A3857&BBOX=0,5009377.085697313,5009377.085697311,10018754.171394626
  if (!params.layer) {
    callback(null);
  }
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + source.name);

  var bbox = tu.tileBboxCalculator(x, y, z);
  var epsg3857ll = proj4('EPSG:3857', [bbox.west, bbox.south]);
  var epsg3857ur = proj4('EPSG:3857', [bbox.east, bbox.north]);

  var c = source.wmsGetCapabilities;
  var url = source.url + '?SERVICE=WMS&REQUEST=GetMap&VERSION=' + c.version + '&LAYERS=' + params.layer + '&FORMAT=image/png&TRANSPARENT=true&HEIGHT=256&WIDTH=256&CRS=EPSG:3857&BBOX=' + epsg3857ll[0] + ',' + epsg3857ll[1] + ',' + epsg3857ur[0] + ',' + epsg3857ur[1];

  console.log('url', url);

  // var url = source.url + "/" + z + '/' + x + '/' + y + '.png';
  var req = request.get({url: url,
    headers: {'Content-Type': 'image/jpeg'},
  })
  .on('error', function(err) {
    console.log(err+ url);

    callback(err, tileInfo);
  })
  .on('response', function(response) {
    var size = response.headers['content-length'];
    SourceModel.updateSourceAverageSize(source, size, function(err) {
    });
  });
  callback(null, req);
}

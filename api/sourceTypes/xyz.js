var CacheModel = require('../../models/cache')
  , SourceModel = require('../../models/source')
  , request = require('request');

exports.createCache = function(cache) {
  var child = require('child_process').fork('api/sourceTypes/xyzProcessor');
  child.send({operation:'generateCache', cache: cache});
}

exports.process = function(source, callback) {
  console.log("xyz");
  source.status = "Complete";
  source.complete = true;
  source.save(function(err) {
    callback(null, source);
  });
}

exports.getTile = function(source, z, x, y, params, callback) {
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + source.name);
  var url = source.url + "/" + z + '/' + x + '/' + y + '.png';
  var req = request.get({url: url,
    headers: {'Content-Type': 'image/png'},
  })
  .on('error', function(err) {
    console.log(err+ url);

    callback(err, tileInfo);
  })
  .on('response', function(response) {
    var size = response.headers['content-length'];
    SourceModel.updateSourceAverageSize(source, size, function(err) {
      console.log('err updating tilesize', err);

    });
  });
  callback(null, req);
}

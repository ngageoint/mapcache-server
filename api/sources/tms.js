var request = require('request');

exports.process = function(source, callback) {
  callback(null, source);
  var child = require('child_process').fork('api/sources/processor.js');
  child.send({operation:'process', sourceId: source.id});
}

exports.getTile = function(source, z, x, y, params, callback) {
  var url = source.url + "/" + z + '/' + x + '/' + y + '.png';
  var req = request.get({url: url,
    headers: {'Content-Type': 'image/png'},
  })
  .on('error', function(err) {
    console.log(err+ url);

    callback(err, tileInfo);
  });
  callback(null, req);
}

exports.getData = function(source, callback) {
  callback(null);
}

exports.processSource = function(source, callback) {
  console.log("tms");
  source.status = "Complete";
  source.complete = true;
  source.save(function(err) {
    callback(err);
  });
}

exports.process = function(source, callback) {
  console.log("tms");
  source.status = "Complete";
  source.complete = true;
  source.save();
  callback(null, source);
}

exports.getTile = function(source, z, x, y, callback) {
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

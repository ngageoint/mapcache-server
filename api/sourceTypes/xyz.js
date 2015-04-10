exports.process = function(source, callback) {
  console.log("xyz");
  callback(null, source);
}

exports.getTile = function(source, z, x, y, callback) {
  console.log('get tile ' + z + '/' + x + '/' + y + '.png for source ' + source.name);
  callback();
}

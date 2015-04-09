exports.process = function(source, callback) {
  console.log("xyz");
  callback(null, source);
}

exports.getTile = function(source, z, x, y, callback) {
  callback();
}

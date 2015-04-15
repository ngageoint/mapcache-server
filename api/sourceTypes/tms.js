exports.process = function(source, callback) {
  console.log("tms");
  callback(null, source);
}

exports.getTile = function(source, z, x, y, callback) {
  callback();
}

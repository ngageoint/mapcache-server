exports.process = function(source, callback) {
  console.log("tms");
  source.status = "Complete";
  source.complete = true;
  source.save();
  callback(null, source);
}

exports.getTile = function(source, z, x, y, callback) {
  callback();
}

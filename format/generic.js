var Generic = function(config) {
  config = config || {};
  this.source = config.source;
  this.cache = config.cache;
};

Generic.prototype.initialize = function() {
};

Generic.prototype.processSource = function(doneCallback) {
  doneCallback(null, this.source);
};

Generic.prototype.getTile = function(format, z, x, y, params, callback) {
  callback(null, null);
};

Generic.prototype.generateCache = function(doneCallback) {
  doneCallback(null, null);
};

Generic.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  callback(null, null);
};

module.exports = Generic;

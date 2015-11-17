var tileImage = require('tile-image')
  , Canvas = require('canvas')
  , Image = Canvas.Image
  , request = require('request')
  , async = require('async');

var GeoTIFF = function(config) {
  config = config || {};
  this.source = config.source;
  this.cache = config.cache;
}

GeoTIFF.prototype.initialize = function() {
}

GeoTIFF.prototype.processSource = function(doneCallback, progressCallback) {
  doneCallback(null, this.source);
}

GeoTIFF.prototype.getTile = function(format, z, x, y, params, callback) {
  callback(null, null);
}

GeoTIFF.prototype.generateCache = function(doneCallback, progressCallback) {
  doneCallback(null, null);
}

GeoTIFF.prototype.getDataWithin = function(west, south, east, north, projection, callback) {
  callback(null, null);
}

module.exports = GeoTIFF;

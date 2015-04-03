var SourceModel = require('../models/source');

function Source() {
}

Source.prototype.getAll = function(options, callback) {
  SourceModel.getSources(options, callback);

}

Source.prototype.create = function(source, callback) {
  SourceModel.createSource(source, function(err, newSource) {
    if (err) return callback(err);
    callback(err, newSource);
  });
}

Source.prototype.getById = function(id, callback) {
  SourceModel.getSourceById(id, function(err, source) {
    callback(err, source);
  });
}

module.exports = Source;

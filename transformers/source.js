var util = require('util');

var transformSources = function(sources) {
  return sources.map(function(source) {
    return source.toJSON({transform: true});
  });
};

exports.transform = function(sources, options) {
  options = options || {};

  return util.isArray(sources) ?
    transformSources(sources, options) :
    sources.toJSON({transform: true});
};

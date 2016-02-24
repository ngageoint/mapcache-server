var util = require('util');

var transformSources = function(sources) {
  return sources.map(function(source) {
    return source.toJSON ? source.toJSON({transform: true}) : source;
  });
};

exports.transform = function(sources, options) {
  options = options || {};

  return util.isArray(sources) ?
    transformSources(sources, options) :
    (sources.toJSON ? sources.toJSON({transform: true}) : sources);
};

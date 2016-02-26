var _ = require('underscore');

module.exports = function userFilter() {
  return function(collection, properties, search) {
    if (!search) return collection;
    if (!collection) return null;

    collection = (_.isArray(collection)) ? collection : [collection];

    var match = new RegExp(search, 'i');
    return collection.filter(function(element) {
      return properties.some(function(property) {
        return match.test(element[property]);
      });
    });
  };
};

var fs = require('fs');

module.exports.geometry = {};

['geometrycollection', 'polygon', 'point', 'multipoint', 'multipolygon',
    'polygon', 'multilinestring'].forEach(function(type) {
    module.exports.geometry[type] = JSON.parse(fs.readFileSync(__dirname + '/data/geometry/' + type + '.geojson'));
});

module.exports.featurecollection = {};

['one', 'idaho'].forEach(function(name) {
    module.exports.featurecollection[name] = JSON.parse(fs.readFileSync(__dirname + '/data/featurecollection/' + name + '.geojson'));
});

module.exports.feature = {};

['one'].forEach(function(name) {
    module.exports.feature[name] = JSON.parse(fs.readFileSync(__dirname + '/data/feature/' + name + '.geojson'));
});

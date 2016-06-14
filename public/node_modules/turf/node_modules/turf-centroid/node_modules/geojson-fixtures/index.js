var fs = require('fs');

module.exports.geometry = {};

var geoms = ['geometrycollection', 'polygon', 'point', 'multipoint', 'multipolygon',
    'polygon', 'multilinestring'];

geoms.forEach(function(type) {
    module.exports.geometry[type] = JSON.parse(fs.readFileSync(__dirname + '/data/geometry/' + type + '.geojson'));
});

geoms.forEach(function(type) {
    module.exports.geometry[type+'-xyz'] = JSON.parse(fs.readFileSync(__dirname + '/data/geometry/' + type + '-xyz.geojson'));
});


module.exports.featurecollection = {};

['one', 'idaho'].forEach(function(name) {
    module.exports.featurecollection[name] = JSON.parse(fs.readFileSync(__dirname + '/data/featurecollection/' + name + '.geojson'));
});

module.exports.feature = {};

['one'].forEach(function(name) {
    module.exports.feature[name] = JSON.parse(fs.readFileSync(__dirname + '/data/feature/' + name + '.geojson'));
});

var all = {};
Object.keys(module.exports).forEach(function(o, i) {
    Object.keys(module.exports[o]).forEach(function(k, j) {
        all[k + '-' + i + '-' + j] = module.exports[o][k];
    });
});

module.exports.all = all;

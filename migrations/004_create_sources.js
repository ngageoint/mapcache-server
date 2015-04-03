var Source = require('../models/source');

exports.id = 'create-initial-sources';

exports.up = function(done) {

  Source.createSource([{
    name: 'OpenStreetMap',
    url: 'http://osm.geointapps.org/osm',
    format: 'xyz'
  }, {
    name: 'Mapbox Outdoors',
    url: 'http://mapbox.geointapps.org:2999/v4/mapbox.mapbox-outdoors',
    format: 'xyz'
  }, {
    name: 'Mapbox Satelite Afternoon',
    url: 'http://mapbox.geointapps.org:2999/v4/mapbox.satelite-afternoon',
    format: 'xyz'
  }, {
    name: 'Mapbox Light',
    url: 'http://mapbox.geointapps.org:2999/v4/mapbox.light',
    format: 'xyz'
  },{
    name: 'Mapbox OSM Bright',
    url: 'http://mapbox.geointapps.org:2999/v4/mapbox.osm-bright',
    format: 'xyz'
  }], done);
};

exports.down = function(done) {

};

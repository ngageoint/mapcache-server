var Source = require('mapcache-models').Source;

exports.id = 'create-initial-sources';

exports.up = function(done) {

  Source.createSource([{
    name: 'OpenStreetMap',
    url: 'http://osm.geointservices.io/tiles',
    format: 'xyz'
  }], done);
};

exports.down = function(done) {

};

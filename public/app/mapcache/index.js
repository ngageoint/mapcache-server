var app = require('angular').module('mapcache');

app.controller('NavController', require('./mapcache-nav.controller.js'));
app.controller('MapcacheController', require('./mapcache.controller.js'));

require('./directives');
require('./map');
require('./leaflet');

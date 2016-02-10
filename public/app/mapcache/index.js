var app = require('angular').module('mapcache');

app.controller('NavController', require('./mapcache-nav.controller.js'));
app.controller('MapcacheController', require('./mapcache.controller.js'));
app.controller('MapsController', require('./maps.controller.js'));
app.controller('LeafletController', require('./leaflet.controller.js'));
app.directive('leaflet', require('./leaflet.directive.js'));



require('./directives');
require('./map');
require('./cache');
require('./leaflet');

var angular = require('angular');
var app = angular.module('mapcache');

app.controller('MapcacheCreateController', require('./mapcache.create.controller'));
app.controller('MapcacheCacheController', require('./mapcache.cache.controller'));
app.controller('MapcacheCacheController', require('./mapcache.cache.controller'));
app.controller('LeafletCreateController', require('./leaflet.create.controller'));
app.controller('LeafletCacheController', require('./leaflet.cache.controller'));

app.directive('leafletCreate', require('./leaflet.create.directive'));
app.directive('leafletCache', require('./leaflet.cache.directive'));

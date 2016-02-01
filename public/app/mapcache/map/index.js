var angular = require('angular');
var app = angular.module('mapcache');

app.controller('LeafletMapController', require('./leaflet.map.controller'));
app.directive('leafletMap', require('./leaflet.map.directive'));

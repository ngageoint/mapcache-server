var angular = require('angular');
var app = angular.module('mapcache');

app.controller('MapController', require('./map.controller'));
app.controller('MapEditController', require('./map.edit.controller'));
app.controller('MapCreateController', require('./map.create.controller'));
app.controller('MapDatasourceController', require('./map.datasource.controller'));
app.directive('mapDatasource', require('./map.datasource.directive'));


app.controller('LeafletMapController', require('./leaflet.map.controller'));
app.directive('leafletMap', require('./leaflet.map.directive'));

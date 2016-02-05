var angular = require('angular');
var app = angular.module('mapcache');

app.directive('cacheListing', require('./cache-listing.directive'));
app.controller('CacheListingController', require('./cache-listing.controller'));

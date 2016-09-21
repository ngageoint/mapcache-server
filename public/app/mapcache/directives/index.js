var angular = require('angular');
var app = angular.module('mapcache');

app.directive('cacheListing', require('./cache-listing.directive'));
app.controller('CacheListingController', require('./cache-listing.controller'));

app.directive('cacheFormats', require('./cache-formats.directive'));
app.controller('CacheFormatsController', require('./cache-formats.controller'));

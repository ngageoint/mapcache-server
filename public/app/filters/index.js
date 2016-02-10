var angular = require('angular');

var app = angular.module('mapcache');

app.filter('cacheFormat', require('./cache-format.filter'));
app.filter('fileSize', require('./file-size.filter'));
app.filter('moment', require('./moment.filter'));
app.filter('offset', require('./paging-offset.filter'));
app.filter('turf', require('./turf.filter'));
app.filter('user', require('./user.filter'));

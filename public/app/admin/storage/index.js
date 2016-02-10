var angular = require('angular');
var app = angular.module('mapcache');

require('../../factories');

app.controller('StorageController', require('./storage.controller'));

var angular = require('angular');
var app = angular.module('mapcache');

app.controller('ColorPickerController', require('./color.picker.controller'));
app.controller('LocationChooserController', require('./location-chooser.controller'));

app.directive('colorPicker', require('./color.picker.directive'));
app.directive('locationChooser', require('./location-chooser.directive'));

var angular = require('angular');
var app = angular.module('mapcache');

app.controller('FileUploadController', require('./file-upload.controller'));
app.directive('fileUpload', require('./file-upload.directive'));

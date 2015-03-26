angular
  .module('mapcache')
  .controller('MapcacheController', MapcacheController);

MapcacheController.$inject = [
  '$scope',
  '$compile',
  '$timeout',
  'LocalStorageService'
];

function MapcacheController($scope, $compile, $timeout, LocalStorageService) {

};

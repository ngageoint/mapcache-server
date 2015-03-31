angular
  .module('mapcache')
  .controller('MapcacheCreateController', MapcacheCreateController);

MapcacheCreateController.$inject = [
  '$scope',
  '$rootScope',
  '$compile',
  '$timeout',
  '$location',
  'LocalStorageService',
  'CacheService'
];

function MapcacheCreateController($scope, $rootScope, $compile, $timeout, $location, LocalStorageService, CacheService) {

  $scope.cache = {};
};

var MapcacheController = function ($scope, $rootScope, $timeout, CacheService) {
  this.CacheService = CacheService;
  this.$timeout = $timeout;
  this.$rootScope = $rootScope;
  $scope.view = {showingTiles: {}, showingDetails: {}};

  $scope.mapcache = this;
  $scope.$watch('mapcache.cacheFilter+mapcache.mapFilter', function() {
    this.$rootScope.$broadcast('cacheFilterChange', {cacheFilter: this.cacheFilter, mapFilter: this.mapFilter});
  }.bind(this));

  $scope.$on('refreshCaches', this.getCaches.bind(this));

  this.mapOptions = {
    opacity: 1
  };

  $rootScope.title = 'Welcome';
  this.initialize();
};

MapcacheController.prototype.initialize = function() {
  this.getCaches();
};

MapcacheController.prototype.getCaches = function() {
  this.CacheService.getAllCaches(true).then(function(caches) {
    this.caches = caches;
    var currentlyGenerating = false;
    for (var i = 0; i < caches.length && !currentlyGenerating; i++) {
      var cache = caches[i];
      for (var format in cache.formats) {
        if(cache.formats.hasOwnProperty(format)){

          if (cache.formats[format].generating) {
            currentlyGenerating = true;
          }
        }
      }
    }
    var delay = currentlyGenerating ? 30000 : 300000;
    this.$timeout(this.getCaches.bind(this), delay);
  }.bind(this));
};

module.exports = MapcacheController;

module.exports = function cacheFormats() {
  var directive = {
    restrict: "A",
    replace: true,
    templateUrl: 'app/mapcache/directives/cache-formats.html',
    scope: {
      cache: '=cacheFormats'
    },
    controller: 'CacheFormatsController'
  };

  return directive;
};

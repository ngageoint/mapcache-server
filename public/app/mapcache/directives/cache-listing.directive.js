module.exports = function cacheListing() {
  var directive = {
    restrict: "A",
    replace: true,
    templateUrl: 'app/mapcache/directives/cache-listing.html',
    scope: {
      map: '=',
      options: '=',
      caches: '='
    },
    controller: 'CacheListingController'
  };

  return directive;
};

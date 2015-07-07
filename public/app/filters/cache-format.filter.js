angular
  .module('mapcache')
  .filter('cacheFormat', cacheFormatFilter);

  cacheFormatFilter.$inject = ['FormatService'];

function cacheFormatFilter(FormatService) {
  return function(input) {
    if (!input) return null;

    return FormatService[input];
  };
}

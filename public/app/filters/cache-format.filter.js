module.exports = function cacheFormatFilter(FormatService) {
  return function(input) {
    if (!input) return null;

    return FormatService[input];
  };
};

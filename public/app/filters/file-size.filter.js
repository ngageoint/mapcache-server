angular
  .module('mapcache')
  .filter('fileSize', fileSizeFilter);

function fileSizeFilter() {
  return function(input) {
    if (!input) return null;

    if (isNaN(parseFloat(input)) || !isFinite(input)) return '-';
    var units = ['bytes', 'kB', 'MB', 'GB', 'TB', 'PB'],
      number = Math.floor(Math.log(input) / Math.log(1024));
    return (input / Math.pow(1024, Math.floor(number))).toFixed(3) +  ' ' + units[number];

  };
}

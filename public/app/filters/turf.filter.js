angular
  .module('mapcache')
  .filter('turf', turfFilter);

function turfFilter() {
  return function(input, operation, option) {
    console.log('turf filter ', input);
    console.log('op', operation);
    console.log('options', option);
    if (!input) return null;

  	if (operation == 'extent') {
      var e = turf.extent(input);
      if (option) {
        switch(option) {
          case 'w':
          return e[0];
          case 's':
          return e[1];
          case 'e':
          return e[2];
          case 'n':
          return e[3];
        }
      }
  		return null;
  	}
    return input;
  };
}

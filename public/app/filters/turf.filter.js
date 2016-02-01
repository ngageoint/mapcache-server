var turf = require('turf-extent');

module.exports = function turfFilter() {
  return function(input, operation, option) {
    if (!input) return null;

  	if (operation === 'extent') {
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
};

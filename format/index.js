var fs = require('fs-extra');
// Dynamically import all routes
fs.readdirSync(__dirname).forEach(function(file) {
  if (file[0] === '.' || file === 'index.js' || file.indexOf('.js') === -1) return;
  var format = file.substr(0, file.indexOf('.'));
  require('./' + format);
});

exports.getFormat = function(format) {
  return require('./'+format);
};

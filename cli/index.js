var source = require('./source')
  , server = require('./server');

var allops = {};

for(var key in source) {
   if (source.hasOwnProperty(key)) {
      allops[key] = source[key];
   }
}
for(var key in server) {
   if (server.hasOwnProperty(key)) {
      allops[key] = server[key];
   }
}

exports.operations = allops;

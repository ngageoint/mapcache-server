var source = require('./source')
  , cache = require('./cache')
  , server = require('./server');

var allops = {};

for(var key in source) {
   if (source.hasOwnProperty(key)) {
      allops[key] = source[key];
   }
}
for(var key in cache) {
   if (cache.hasOwnProperty(key)) {
      allops[key] = cache[key];
   }
}
for(var key in server) {
   if (server.hasOwnProperty(key)) {
      allops[key] = server[key];
   }
}

exports.operations = allops;

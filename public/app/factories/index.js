var app = require('angular').module('mapcache');

app.service('UserService', require('./user.service'));
app.service('LocalStorageService', require('./local-storage.service'));
app.service('CacheService', require('./cache.service'));
app.service('FormatService', require('./format.service'));
app.service('MapService', require('./map.service'));
app.service('ServerService', require('./server.service'));

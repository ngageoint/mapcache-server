var util = require('util');

var transformServers = function(servers) {
  return servers.map(function(server) {
    return server.toJSON({transform: true});
  });
};

exports.transform = function(servers, options) {
  options = options || {};

  return util.isArray(servers) ?
    transformServers(servers, options) :
    servers.toJSON({transform: true});
};

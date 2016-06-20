var mongoose = require('mongoose')
	, diskspace = require('diskspace')
  , du = require('du')
	, config = require('mapcache-config');

// Creates a new Mongoose Schema object
var Schema = mongoose.Schema;

// Creates the Schema for the cache objects
var ServerSchema = new Schema({
  total: { type: Number, required: true},
  used: { type: Number, required: true},
	maximumCacheSize: { type: Number, required: true},
  serverTotal: { type: Number, required: true},
  serverFree: { type: Number, required: true}
});

function transform(cache, ret) {
	ret.id = ret._id;
	delete ret._id;

	delete ret.__v;
}

ServerSchema.set("toJSON", {
  transform: transform
});

var Server;
if (mongoose.models.Server) {
	Server = mongoose.model('Server');
} else {
	Server = mongoose.model('Server', ServerSchema);
}
exports.serverModel = Server;

exports.getInfo = function(callback) {
  Server.findOne().exec(function(err, server) {
    if (server) {
      callback(null, server);
      // updateServer(server, callback);
    } else {
      Server.create({
        total: config.server.storageLimit * 1024 * 1024,
        used: 0,
        serverTotal: 0,
        serverFree: 0,
				maximumCacheSize: config.server.maximumCacheSize * 1024 * 1024
      }, function(err, server) {
        updateServer(server, callback);
      });
    }
  });
};

exports.getMaxCacheSize = function(callback) {
  Server.findOne().exec(function(err, server) {
		var maxSize = {};
		maxSize.maximumCacheSize = server && server.maximumCacheSize ? server.maximumCacheSize : config.server.maximumCacheSize * 1024 * 1024;
		callback(err, maxSize);
  });
};

function updateServer(server, callback) {
  diskspace.check('/', function(err, total, free) {
    server.serverTotal = total;
    server.serverFree = free;
		server.total = config.server.storageLimit * 1024 * 1024;
    du(config.server.cacheDirectory.path, function(err, size) {
      server.used = size;
			server.maximumCacheSize = config.server.maximumCacheSize * 1024 * 1024;
      server.save(function() {
        callback(err, server);
      });
    });
  });
}

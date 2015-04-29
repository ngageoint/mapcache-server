var ServerModel = require('../models/server');

function Server() {
}

Server.prototype.getInfo = function(callback) {
  ServerModel.getInfo(callback);
}

module.exports = Server;

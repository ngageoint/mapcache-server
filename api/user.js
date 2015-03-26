var UserModel = require('../models/user')
  , TokenModel = require('../models/token')
  , LoginModel = require('../models/login')
  , path = require('path')
  , async = require('async')
  , config = require('../config.json');

var userBase = config.server.userBaseDirectory;

function contentPath(id, user, content, type) {
  var relativePath = path.join(id.toString(), type + path.extname(content.path));
  var absolutePath = path.join(userBase, relativePath);
  return {
    relativePath: relativePath,
    absolutePath: absolutePath
  };
}

function User() {
};

User.prototype.login = function(user, options, callback) {
  TokenModel.createToken({userId: user._id}, function(err, token) {
    if (err) return callback(err);

    callback(null, token);

    LoginModel.createLogin(user, function(err, login) {
      if (err) console.log('could not add login', err);
    });

    var update = {
      userId: user._id
    };
    if (options.userAgent) update.userAgent = options.userAgent;
    if (options.appVersion) update.appVersion = options.appVersion;
  });
}

User.prototype.logout = function(token, callback) {
  if (!token) return callback();

  TokenModel.removeToken(token, function(err, token){
    callback(err);
  });
}

User.prototype.getAll = function(callback) {
  UserModel.getUsers(function (err, users) {
    callback(err, users);
  });
}

User.prototype.getById = function(id, callback) {
  UserModel.getUserById(id, function(err, user) {
    callback(err, user);
  });
}

User.prototype.create = function(user, callback) {
  var operations = [];
  operations.push(function(done) {
    UserModel.createUser(user, function(err, newUser) {
      done(err, newUser);
    });
  });

  async.waterfall(operations, function(err, newUser) {
    if (err) return callback(err);

    return callback(null, newUser);
  });
}

User.prototype.update = function(id, update, options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }

  var operations = [];
  operations.push(function(done) {
    done(null, update);
  });

  async.waterfall(operations, function(err, updatedUser) {
    if (err) return callback(err);

    UserModel.updateUser(id, updatedUser, callback);
  });
}

User.prototype.delete = function(user, callback) {
  UserModel.deleteUser(user, function(err) {
    callback(err);
  });
}

module.exports = User;

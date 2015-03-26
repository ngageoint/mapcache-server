module.exports = function(strategy) {

  var passport = require('passport')
    , User = require('../models/user')
    , Token = require('../models/token');

  passport.serializeUser(function(user, done) {
    done(null, user._id);
  });

  passport.deserializeUser(function(id, done) {
    User.getUserById(id, function(err, user) {
      done(err, user);
    });
  });

  // setup passport authentication
  var authentication = require('./' + strategy)(passport);

  return authentication;
}
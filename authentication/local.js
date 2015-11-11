module.exports = function(passport) {

  var LocalStrategy = require('passport-local').Strategy
    , BearerStrategy = require('passport-http-bearer').Strategy
    , models = require('mapcache-models')
    , Token = models.Token
    , User = models.User;

  passport.use(new BearerStrategy(
    {passReqToCallback: true},
    function(req, token, done) {
      Token.getToken(token, function(err, credentials) {
        if (err) { return done(err); }

        if (!credentials || !credentials.user) { return done(null, false); }

        req.token = credentials.token;

        return done(null, credentials.user, { scope: 'all' });
      });
    }
  ));

  passport.use(new LocalStrategy(
    function(username, password, done) {
      console.log('Authenticating user: ' + username);
      User.getUserByUsername(username, function(err, user) {
        if (err) { return done(err); }

        if (!user) {
          console.log('Failed login attempt: User with username ' + username + ' not found');
          return done(null, false, { message: "User with username '" + username + "' not found" });
        }

        if (!user.active) {
          console.log('Failed user login attempt: User ' + user.username + ' is not active');
          return done(null, false, { message: "User with username '" + username + "' not active" });
        }

        user.validPassword(password, function(err, isValid) {
          if (err) {
            return done(err);
          }

          if (!isValid) {
            console.log('Failed login attempt: User with username ' + username + ' provided an invalid password');
            return done(null, false);
          }

          return done(null, user);
        });
      });
    }
  ));

  return {
    passport: passport,
    loginStrategy: 'local',
    authenticationStrategy: 'bearer'
  }
}

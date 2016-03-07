module.exports = function(passport) {

  var LocalStrategy = require('passport-local').Strategy
    , BearerStrategy = require('passport-http-bearer').Strategy
    , BasicStrategy = require('passport-http').BasicStrategy
    , ClientPasswordStrategy = require('passport-oauth2-client-password').Strategy
    , models = require('mapcache-models')
    , Token = models.Token
    , User = models.User;

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

  passport.use(new BasicStrategy(
    function(username, password, done) {
      models.oauthModels.Client.findByClientId(username, function(err, client) {
        if (err) { return done(err); }
        if (!client) { return done(null, false); }
        if (client.clientSecret !== password) { return done(null, false); }
        return done(null, client);
      });
    }
  ));

  passport.use(new ClientPasswordStrategy(
    function(clientId, clientSecret, done) {
      models.oauthModels.Client.findByClientId(clientId, function(err, client) {
        if (err) { return done(err); }
        if (!client) { return done(null, false); }
        if (client.clientSecret !== clientSecret) { return done(null, false); }
        return done(null, client);
      });
    }
  ));

  passport.use(new BearerStrategy(
    {passReqToCallback: true},
    function(req, token, done) {
      Token.getToken(token, function(err, credentials) {
        if (err) { return done(err); }
        if (!credentials || !credentials.user) {
          return done(null, false);
        }
        req.token = credentials.token;

        return done(null, credentials.user, { scope: 'all' });
      });
    }
  ));

  passport.use('oauth', new BearerStrategy(
    {passReqToCallback: true},
    function(req, token, done) {
      // check here for oauth token
      return models.oauth.AccessToken.findOne({ token: token }).populate('user').populate('grant').exec(function(error, token) {
        if (token && token.active && token.grant.active && token.user) {
          req.token = token;
          return done(null, token.user, { scope: 'all' });
        } else if (!error) {
          done(null, false);
        } else {
          done(error);
        }
      });
    }
  ));

  return {
    passport: passport,
    loginStrategy: 'local',
    authenticationStrategy: 'bearer',
    oauthStrategy: 'oauth'
  };
};

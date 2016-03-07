
var oauth2orize = require('oauth2orize')
  , models = require('mapcache-models')
  , oauthModels = models.oauth
  , api = require('../api')
  , session = require('express-session')
  , mongoose = require('mongoose');

module.exports = function(app, security) {
  var passport = security.authentication.passport
    , authenticationStrategy = security.authentication.authenticationStrategy
    , loginStrategy = security.authentication.loginStrategy;

  var MongoStore = require('connect-mongo/es5')(session);

  app.use(session({
    store: new MongoStore({
      mongooseConnection: mongoose.connection
    }),
    resave: true,
    saveUninitialized: true,
    secret: process.env.SESSION_SECRET || 'SECRETKEY'
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  app.set('views', __dirname + '/views');
  app.set('view engine', 'ejs');

  var server = oauth2orize.createServer();

  server.grant(oauth2orize.grant.code({
    scopeSeparator: [ ' ', ',' ]
  }, function(application, redirectURI, user, ares, done) {
    var grant = new oauthModels.GrantCode({
      application: application,
      user: user,
      scope: ares.scope
    });
    grant.save(function(error) {
      done(error, error ? null : grant.code);
    });
  }));
  server.exchange(oauth2orize.exchange.code({
    userProperty: 'app'
  }, function(application, code, redirectURI, done) {
    oauthModels.GrantCode.findOne({ code: code }).populate('user').exec(function(error, grant) {
      if (grant && grant.active && grant.application == application.id) {
        var token = new oauthModels.AccessToken({
          application: grant.application,
          user: grant.user,
          grant: grant,
          scope: grant.scope
        });
        token.save(function(error) {
          done(error, error ? null : token.token, null, error ? null : { token_type: 'standard' });
        });
      } else {
        done(error, false);
      }
    });
  }));
  server.serializeClient(function(application, done) {
    done(null, application.id);
  });
  server.deserializeClient(function(id, done) {
    oauthModels.Application.findById(id, function(error, application) {
      done(error, error ? null : application);
    });
  });


  app.get('/oauth2/auth',
    function(req, res, next) {
      console.log('auth');
      return res.redirect( '/oauth2/login?response_type='+req.param('response_type') +'&redirect_uri='+req.param('redirect_uri') +'&scope='+req.param('scope') +'&client_id='+req.param('client_id'));
    }
  );

  var authorization = server.authorization(function(applicationID, redirectURI, done) {
    console.log('looking for client %s redirectURI %s', applicationID, redirectURI);
    oauthModels.Application.findOne({ oauth_id: applicationID }, function(error, application) {
      if (application) {
        var match = false, uri = redirectURI;
        match = true;
        // commenting this out for now, this checks that the application comes from the proper host
        // for (var i = 0; i < application.domains.length; i++) {
        //     if (uri.host == application.domains[i] || (uri.protocol == application.domains[i] && uri.protocol != 'http' && uri.protocol != 'https')) {
        //         match = true;
        //         break;
        //     }
        // }
        if (match && redirectURI && redirectURI.length > 0) {
          done(null, application, redirectURI);
        } else {
          done(new Error("You must supply a redirect_uri that is a domain or url scheme owned by your app."), false);
        }
      } else if (!error) {
        done(new Error("There is no app with the client_id you supplied."), false);
      } else {
        done(error);
      }
    });
  });

  var renderDialog = function(req, res) {
    res.render('dialog', {
      transactionID: req.oauth2.transactionID,
      currentURL: req.originalUrl,
      response_type: req.query.response_type,
      errors: [],
      scope: req.oauth2.req.scope,
      client: req.oauth2.client,
      token: req.query.access_token,
      user: req.user,
      state: req.query.state
    });
  };

  app.get('/oauth2/login',
    function(req, res) {
      res.render('login', {
        response_type: req.query.response_type,
        redirect_uri: req.query.redirect_uri,
        client_id: req.query.client_id,
        scope: req.query.scope,
        loginFailure: req.query.loginFailure || ''
      });
    }
  );

  app.post('/oauth2/login',
    function(req, res, next) {
      return passport.authenticate(loginStrategy, function(err, user, info) {
        if (err) { return next(err); }
        if (!user) {
          return res.redirect( '/oauth2/login?response_type='+req.param('response_type') +'&redirect_uri='+req.param('redirect_uri') +'&scope='+req.param('scope') +'&client_id='+req.param('client_id')+'&loginFailure=true');
        }
        req.user = user;
        next();
      })(req, res, next);
    },
    function(req, res, next) {
      var options = {userAgent: req.headers['user-agent'], appVersion: req.param('appVersion')};
      new api.User().login(req.user, options, function(err, token) {
        req.query.access_token = token.token;
        next();
      });
    },
    function(req, res, next) {
      req.query.response_type = req.body.response_type;
      req.query.redirect_uri = req.body.redirect_uri;
      req.query.client_id = req.body.client_id;
      req.query.scope = req.body.scope;
      req.query.state = req.body.state;
      next();
    },
    authorization,
    renderDialog
  );

  app.get('/oauth2/dialog',
    passport.authenticate(authenticationStrategy),
    function(req, res, next) {
      req.query.response_type = req.body.response_type;
      req.query.redirect_uri = req.body.redirect_uri;
      req.query.client_id = req.body.client_id;
      req.query.scope = req.body.scope;
      req.query.state = req.body.state;
      next();
    },
    authorization,
    renderDialog
  );

  app.post('/oauth2/decision',
    passport.authenticate(authenticationStrategy),
    server.decision(function(req, done) {
    done(null, {scope:req.oauth2.req.scope});
  }));

  app.post('/oauth2/exchange', function(req, res, next){
    var appID = req.body['client_id'];
    var appSecret = req.body['client_secret'];

    oauthModels.Application.findOne({ oauth_id: appID, oauth_secret: appSecret }, function(error, application) {
      if (application) {
        req.app = application;
        next();
      } else if (!error) {
        error = new Error("There was no application with the Application ID and Secret you provided.");
        next(error);
      } else {
        next(error);
      }
    });
  }, server.token(), server.errorHandler());

};

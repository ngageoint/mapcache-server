module.exports = function(app, security) {
  var api = require('../api')
    , Role = require('../models/role')
    , access = require('../access')
    , config = require('../config.js')
    , fs = require('fs-extra')
    , userTransformer = require('../transformers/user')
    , passport = security.authentication.passport
    , loginStrategy = security.authentication.loginStrategy
    , authenticationStrategy = security.authentication.authenticationStrategy;

  var passwordLength = config.api.authentication.passwordMinLength;
  var emailRegex = /^[^\s@]+@[^\s@]+\./;

  var isAuthenticated = function(strategy) {
    return function(req, res, next) {
      passport.authenticate(strategy, function(err, user, info) {
        if (err) return next(err);

        if (user) req.user = user;

        next();

      })(req, res, next);
    }
  }

  var getDefaultRole = function(req, res, next) {
    Role.getRole('USER_ROLE', function(err, role) {
      req.role = role;
      next();
    });
  }

  var validateUser = function(req, res, next) {
    var invalidResponse = function(param) {
      return "Cannot create user, invalid parameters.  '" + param + "' parameter is required";
    }

    var user = {};

    var username = req.param('username');
    if (!username) {
      return res.status(400).send(invalidResponse('username'));
    }
    user.username = username;

    var firstname = req.param('firstname');
    if (!firstname) {
      return res.status(400).send(invalidResponse('firstname'));
    }
    user.firstname = firstname;

    var lastname = req.param('lastname');
    if (!lastname) {
      return res.status(400).send(invalidResponse('lastname'));
    }
    user.lastname = lastname;

    var email = req.param('email');
    if (email) {
      // validate they at least tried to enter a valid email
      if (!email.match(emailRegex)) {
        return res.status(400).send('Please enter a valid email address');
      }

      user.email = email;
    }

    var phone = req.param('phone');
    if (phone) {
      user.phones = [{
        type: "Main",
        number: phone
      }];
    }

    var password = req.param('password');
    if (!password) {
      return res.status(400).send(invalidResponse('password'));
    }

    var passwordconfirm = req.param('passwordconfirm');
    if (!passwordconfirm) {
      return res.status(400).send(invalidResponse('passwordconfirm'));
    }

    if (password != passwordconfirm) {
      return res.status(400).send('passwords do not match');
    }

    if (password.length < passwordLength) {
      return res.status(400).send('password does not meet minimum length requirement of ' + passwordLength + ' characters');
    }

    user.password = password;

    req.newUser = user;

    next();
  }

  var validateRoleParams = function(req, res, next) {
    var roleId = req.param('roleId');
    if (!roleId) {
      return res.status(400).send("Cannot set role, 'roleId' param not specified");
    }

    Role.getRoleById(roleId, function(err, role) {
      if (err) return next(err);

      if (!role) return next(new Error('Role associated with roleId ' + roleId + ' does not exist'));

      req.role = role;
      next();
    });
  }

  app.post(
    '/api/login',
    passport.authenticate(loginStrategy),
    function(req, res) {
      var options = {userAgent: req.headers['user-agent'], appVersion: req.param('appVersion')};
      new api.User().login(req.user, options, function(err, token) {
        res.json({
          token: token.token,
          expirationDate: token.expirationDate,
          user: userTransformer.transform(req.user, {path: req.getRoot()})
        });
      });
    }
  );

  // logout
  app.post(
    '/api/logout',
    isAuthenticated(authenticationStrategy),
    function(req, res, next) {
      console.log('logout w/ token', req.token);
      new api.User().logout(req.token, function(err) {
        if (err) return next(err);
        res.status(200).send('successfully logged out');
      });
    }
  );

  // get all uses
  app.get(
    '/api/users',
    passport.authenticate(authenticationStrategy),
    access.authorize('READ_USER'),
    function(req, res) {
      new api.User().getAll(function (err, users) {
        users = userTransformer.transform(users, {path: req.getRoot()});
        res.json(users);
      });
  });

  // get info for the user bearing a token, i.e get info for myself
  app.get(
    '/api/users/myself',
    passport.authenticate(authenticationStrategy),
    function(req, res) {
      var user = userTransformer.transform(req.user, {path: req.getRoot()});
      res.json(user);
    }
  );

  // get user by id
  app.get(
    '/api/users/:userId',
    passport.authenticate(authenticationStrategy),
    access.authorize('READ_USER'),
    function(req, res) {
      user = userTransformer.transform(req.userParam, {path: req.getRoot()});
      res.json(user);
    }
  );

  // update myself
  app.put(
    '/api/users/myself',
    passport.authenticate(authenticationStrategy),
    function(req, res, next) {

      var update = {};
      if (req.param('username')) update.username = req.param('username');
      if (req.param('firstname')) update.firstname = req.param('firstname');
      if (req.param('lastname')) update.lastname = req.param('lastname');
      if (req.param('email')) update.email = req.param('email');

      var phone = req.param('phone');
      if (phone) {
        update.phones = [{
          type: "Main",
          number: phone
        }];
      }

      var password = req.param('password');
      var passwordconfirm = req.param('passwordconfirm');
      if (password && passwordconfirm) {
        if (password != passwordconfirm) {
          return res.status(400).send('passwords do not match');
        }

        if (password.length < passwordLength) {
          return res.status(400).send('password does not meet minimum length requirment of ' + passwordLength + ' characters');
        }

        update.password = password;
      }

      new api.User().update(req.user._id, update, function(err, updatedUser) {
        updatedUser = userTransformer.transform(updatedUser, {path: req.getRoot()});
        res.json(updatedUser);
      });
    }
  );

  // Create a new user (ADMIN)
  // If authentication for admin fails go to next route and
  // create user as non-admin, roles will be empty
  app.post(
    '/api/users',
    isAuthenticated(authenticationStrategy),
    validateUser,
    function(req, res, next) {
      // If I did not authenticate a user go to the next route
      // '/api/users' route which does not require authentication
      if (!access.userHasPermission(req.user, 'CREATE_USER')) {
        return next();
      }

      var roleId = req.param('roleId');
      if (!roleId) return res.status(400).send('roleId is a required field');
      req.newUser.roleId = roleId;

      // Authorized to update users, activate account by default
      req.newUser.active = true;

      new api.User().create(req.newUser, function(err, newUser) {
        if (err) return next(err);

        newUser = userTransformer.transform(newUser, {path: req.getRoot()});
        res.json(newUser);
      });
    }
  );

  // Create a new user
  // Anyone can create a new user, but the new user will not be active
  app.post(
    '/api/users',
    getDefaultRole,
    validateUser,
    function(req, res, next) {
      req.newUser.active = false;
      req.newUser.roleId = req.role._id;

      new api.User().create(req.newUser, function(err, newUser) {
        if (err) return next(err);

        newUser = userTransformer.transform(newUser, {path: req.getRoot()});
        res.json(newUser);
      });
    }
  );

  // Update a specific user
  app.put(
    '/api/users/:userId',
    passport.authenticate(authenticationStrategy),
    access.authorize('UPDATE_USER'),
    function(req, res, next) {
      var update = {};

      if (req.param('username')) update.username = req.param('username');
      if (req.param('firstname')) update.firstname = req.param('firstname');
      if (req.param('lastname')) update.lastname = req.param('lastname');
      if (req.param('email')) update.email = req.param('email');
      if (req.param('active')) update.active = req.param('active');
      if (req.param('roleId')) update.roleId = req.param('roleId');

      var phone = req.param('phone');
      if (phone) {
        update.phones = [{
          type: "Main",
          number: phone
        }];
      }

      var password = req.param('password');
      var passwordconfirm = req.param('passwordconfirm');
      if (password && passwordconfirm) {
        if (password != passwordconfirm) {
          return res.status(400).send('passwords do not match');
        }

        if (password.length < passwordLength) {
          return res.status(400).send('password does not meet minimum length requirment of ' + passwordLength + ' characters');
        }

        update.password = password;
      }

      new api.User().update(req.userParam.id, update, function(err, updatedUser) {
        if (err) return next(err);

        updatedUser = userTransformer.transform(updatedUser, {path: req.getRoot()});
        res.json(updatedUser);
      });
    }
  );

  // Delete a specific user
  app.delete(
    '/api/users/:userId',
    passport.authenticate(authenticationStrategy),
    access.authorize('DELETE_USER'),
    function(req, res, next) {
      new api.User().delete(req.userParam, function(err) {
        if (err) return next(err);

        res.sendStatus(204);
      });
    }
  );

  // set role for user
  // TODO not sure used, remove in next version (teams/events)
  app.post(
    '/api/users/:userId/role',
    passport.authenticate(authenticationStrategy),
    access.authorize('UPDATE_USER'),
    validateRoleParams,
    function(req, res) {
      req.userParm.role = role;

      new api.User().update(req.userParam, function(err, updatedUser) {
        if (err) return next(err);

        updatedUser = userTransformer.transform(updatedUser, {path: req.getRoot()});
        res.json(updatedUser);
      });
    }
  );

}

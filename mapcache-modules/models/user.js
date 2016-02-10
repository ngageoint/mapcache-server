var mongoose = require('mongoose')
  , async = require("async")
  , hasher = require('pbkdf2')()
  , Token = require('./token')
  , Login = require('./login');

// Creates a new Mongoose Schema object
var Schema = mongoose.Schema;

var PhoneSchema = new Schema({
  type: { type: String, required: true },
  number: { type: String, required: true }
},{
  versionKey: false,
  _id: false
});

// Collection to hold users
var UserSchema = new Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  firstname: { type: String, required: true },
  lastname: {type: String, required: true },
  email: {type: String, required: false },
  phones: [PhoneSchema],
  active: { type: Boolean, required: true },
  roleId: { type: Schema.Types.ObjectId, ref: 'Role', required: true }
},{
  versionKey: false
});

UserSchema.method('validPassword', function(password, callback) {
  var user = this;
  hasher.validPassword(password, user.password, callback);
});

// Lowercase the username we store, this will allow for case insensitive usernames
// Validate that username does not already exist
UserSchema.pre('save', function(next) {
  var user = this;
  user.username = user.username.toLowerCase();
  this.model('User').findOne({username: user.username}, function(err, possibleDuplicate) {
    if (err) return next(err);

    if (possibleDuplicate && !possibleDuplicate._id.equals(user._id)) {
      return next(new Error('username already exists'));
    }

    next();
  });
});

// Encrypt password before save
UserSchema.pre('save', function(next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) {
    return next();
  }

  hasher.encryptPassword(user.password, function(err, encryptedPassword) {
    if (err) return next(err);

    user.password = encryptedPassword;
    next();
  });
});

// Remove Token if password changed
UserSchema.pre('save', function(next) {
  var user = this;

  // only hash the password if it has been modified (or is new)
  if (!user.isModified('password')) {
    return next();
  }

  Token.removeTokensForUser(user, function(err) {
    if (err) return next(err);

    next();
  });
});

UserSchema.pre('remove', function(next) {
  var user = this;

  async.parallel({
    token: function(done) {
      Token.removeTokensForUser(user, function(err) {
        done(err);
      });
    },
    login: function(done) {
      Login.removeLoginsForUser(user, function(err) {
        done(err);
      });
    }
  },
  function(err) {
    next(err);
  });
});

var transform = function(user, ret) {
  if ('function' !== typeof user.ownerDocument) {
    ret.id = ret._id;
    delete ret._id;

    delete ret.password;

    if (user.populated('roleId')) {
      ret.role = ret.roleId;
      delete ret.roleId;
    }
  }
};

UserSchema.set("toJSON", {
  transform: transform
});

// Creates the Model for the User Schema
var User = mongoose.model('User', UserSchema);
exports.Model = User;

exports.transform = transform;

exports.getUserById = function(id, callback) {
  User.findById(id).populate('roleId').exec(function(err, user) {
    callback(err, user);
  });
};

exports.getUserByUsername = function(username, callback) {
  User.findOne({username: username.toLowerCase()}).populate('roleId').exec(function(err, user) {
    callback(err, user);
  });
};

exports.getUsers = function(callback) {
  var query = {};
  User.find(query, function (err, users) {
    if (err) {
      console.log("Error finding users: " + err);
    }

    callback(err, users);
  });
};

exports.createUser = function(user, callback) {
  var create = {
    username: user.username,
    firstname: user.firstname,
    lastname: user.lastname,
    email: user.email,
    phones: user.phones,
    password: user.password,
    active: user.active,
    roleId: user.roleId
  };

  User.create(create, function(err, user) {
    if (err) return callback(err);

    callback(null, user);
  });
};

exports.updateUser = function(id, update, callback) {
  User.findByIdAndUpdate(id, update, function(err, updatedUser) {
    if (err) console.log('Could not update user', err);

    callback(err, updatedUser);
  });
};

exports.deleteUser = function(user, callback) {
  user.remove(function(err, removedUser) {
    if (err) console.log("Error removing user: " + err);
    callback(err, removedUser);
  });
};

exports.setRoleForUser = function(user, role, callback) {
  var update = { role: role };
  User.findByIdAndUpdate(user._id, update, function (err, user) {
    if (err) {
      console.log('could not set role ' + role + ' for user: ' + user.username);
    }

    callback(err, user);
  });
};

exports.removeRolesForUser = function(user, callback) {
  var update = { roles: [] };
  User.findByIdAndUpdate(user._id, update, function (err, user) {
    if (err) {
      console.log('could not remove roles for user ' + user.username);
    }

    callback(err, user);
  });
};

exports.removeRoleFromUsers = function(role, callback) {
  User.update({role: role._id}, {roles: undefined}, function(err, number) {
    if (err) {
      console.log('Error pulling role: ' + role.name + ' from all users', err);
    }

    callback(err, number);
  });
};

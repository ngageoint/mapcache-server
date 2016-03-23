var uid = require('uid2');
var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ApplicationSchema = new Schema({
  title: { type: String, required: true },
  oauth_id: { type: String, unique: true },
  oauth_secret: { type: String, unique: true, default: function() {
      return uid(42);
    }
  },
  icon_url: { type: String },
  domains: [ { type: String } ]
});
var GrantCodeSchema = new Schema({
  code: { type: String, unique: true, default: function() {
      return uid(24);
    }
  },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  application: { type: Schema.Types.ObjectId, ref: 'Application' },
  scope: [ { type: String } ],
  active: { type: Boolean, default: true }
});
var AccessTokenSchema = new Schema({
  token: { type: String, unique: true, default: function() {
      return uid(124);
    }
  },
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  application: { type: Schema.Types.ObjectId, ref: 'Application' },
  grant: { type: Schema.Types.ObjectId, ref: 'GrantCode' },
  scope: [ { type: String }],
  expires: { type: Date, default: function(){
    var today = new Date();
    var length = 60; // Length (in minutes) of our access token
    return new Date(today.getTime() + length*60000);
  } },
  active: { type: Boolean, get: function(value) {
    if (this.expires < new Date() || !value) {
      return false;
    } else {
      return value;
    }
  }, default: true }
});

exports.Application = mongoose.model('Application', ApplicationSchema);
exports.GrantCode = mongoose.model('GrantCode', GrantCodeSchema);
exports.AccessToken = mongoose.model('AccessToken', AccessTokenSchema);

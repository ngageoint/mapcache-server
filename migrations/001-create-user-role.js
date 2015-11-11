var Role = require('mapcache-models').Role;

exports.id = 'create-initial-user-role';

exports.up = function(done) {

  var userPermissions = [ 'READ_USER', 'READ_SERVER','CREATE_CACHE', 'READ_CACHE', 'UPDATE_CACHE', 'EXPORT_CACHE'];
  var userRole = {
    name: "USER_ROLE",
    description: "User role, limited acces to MAGE API.",
    permissions: userPermissions
  };

  Role.createRole(userRole, done);
};

exports.down = function(done) {
  Role.getRole("USER_ROLE", function(err, role) {
    if (err || !role) return done(err);

    Role.deleteRole(role, done);
  });
};

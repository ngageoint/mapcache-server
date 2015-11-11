var userPermissions = [
  'CREATE_USER',
  'READ_USER',
  'UPDATE_USER',
  'DELETE_USER',
];

var rolePermissions = [
  'CREATE_ROLE',
  'READ_ROLE',
  'UPDATE_ROLE',
  'DELETE_ROLE'
];

var cachePermissions = [
   'CREATE_CACHE',
   'READ_CACHE',
   'UPDATE_CACHE',
   'DELETE_CACHE',
   'EXPORT_CACHE'
];

var serverPermissions = [
   'CREATE_SERVER',
   'READ_SERVER',
   'UPDATE_SERVER',
   'DELETE_SERVER'
];

var featurePermissions = [
    'CREATE_FEATURE',
    'READ_FEATURE',
    'UPDATE_FEATURE',
    'DELETE_FEATURE',
];

var teamPermissions = [
   'CREATE_TEAM',
   'READ_TEAM',
   'UPDATE_TEAM',
   'DELETE_TEAM'
 ];

var allPermissions = []
  .concat(userPermissions)
  .concat(rolePermissions)
  .concat(cachePermissions)
  .concat(serverPermissions)
  .concat(featurePermissions)
  .concat(teamPermissions);

exports.getPermissions = function() {
  return allPermissions;
}

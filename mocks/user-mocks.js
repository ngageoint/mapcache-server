var exports = module.exports;

exports.adminUser = {
  "username": "admin",
  "firstname": "admin",
  "lastname": "admin",
  "active": true,
  "phones": [{
    "type": "personal",
    "number": "555-555-5555"
  }],
  "id": "55661b3dd503958c15681833",
  "role": {
    "name": "ADMIN_ROLE",
    "description": "Administrative role, full acces to entire MAGE API.",
    "permissions": [
      "CREATE_USER",
      "READ_USER",
      "UPDATE_USER",
      "DELETE_USER",
      "CREATE_ROLE",
      "READ_ROLE",
      "UPDATE_ROLE",
      "DELETE_ROLE",
      "CREATE_CACHE",
      "READ_CACHE",
      "UPDATE_CACHE",
      "DELETE_CACHE",
      "EXPORT_CACHE",
      "CREATE_SERVER",
      "READ_SERVER",
      "UPDATE_SERVER",
      "DELETE_SERVER"
    ],
    "id": "55661b3dd503958c15681832"
  }
};

exports.regularUser = {
  "username": "regular",
  "firstname": "regular",
  "lastname": "regular",
  "active": true,
  "phones": [{
    "type": "personal",
    "number": "555-555-5555"
  }],
  "id": "55661b3dd503958c15681833",
  "role": {
    "name": "USER_ROLE",
    "description": "User",
    "permissions": [
      "CREATE_CACHE",
      "READ_CACHE",
      "UPDATE_CACHE",
      "EXPORT_CACHE"
    ],
    "id": "55661b3dd503958c15681831"
  }
};

exports.users = [exports.adminUser, exports.regularUser];

exports.newUser = {
  "username": "newuser",
  "firstname": "newuser",
  "lastname": "newuser",
  "password": "password",
  "passwordconfirm":"password"
};

exports.loginUser = {
  "username": "newuser",
  "password": "password"
};

exports.loginAdminUserResponse = {
  token: '5',
  expirationDate: new Date('1982-01-17T03:24:00'),
  user: exports.adminUser
};

exports.loginRegularUserResponse = {
  token: '55',
  expirationDate: new Date('1982-01-17T03:24:00'),
  user: exports.regularUser
};

exports.roles = [
  {
    "name": "USER_ROLE",
    "description": "User role, limited acces to MAGE API.",
    "permissions": [
      "READ_USER",
      "READ_SERVER",
      "CREATE_CACHE",
      "READ_CACHE",
      "UPDATE_CACHE",
      "EXPORT_CACHE"
    ],
    "id": "5515b85b36d7dccd0b962494"
  },
  {
    "name": "ADMIN_ROLE",
    "description": "Administrative role, full acces to entire MAGE API.",
    "permissions": [
      "CREATE_USER",
      "READ_USER",
      "UPDATE_USER",
      "DELETE_USER",
      "CREATE_ROLE",
      "READ_ROLE",
      "UPDATE_ROLE",
      "DELETE_ROLE",
      "CREATE_CACHE",
      "READ_CACHE",
      "UPDATE_CACHE",
      "DELETE_CACHE",
      "EXPORT_CACHE",
      "CREATE_SERVER",
      "READ_SERVER",
      "UPDATE_SERVER",
      "DELETE_SERVER"
    ],
    "id": "5515b85b36d7dccd0b962495"
  }
];

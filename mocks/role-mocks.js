var exports = module.exports;

exports.adminRole = {
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
};

exports.roles = [exports.adminRole];

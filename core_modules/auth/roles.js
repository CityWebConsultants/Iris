var roles = {
  // anonymous user: anyone accessing the API
  'anonymous': {
    permissions: []
  },
  // authenticated user: anyone who has successfuly authenticated
  // with a userid/token pair
  'authenticated': {
    permissions: ["can create group", "can create 121 group", "can create message", "can edit group"]
  },
  // admin user: anyone authenticated with userid defined as admin
  // OR anyone authenticating with secretkey and apikey
  'admin': {

    permissions: ["can do anything"]

  }
};

module.exports = roles;

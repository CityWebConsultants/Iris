/*jslint node: true */

"use strict";

var crypto = require('crypto');

C.registerModule("auth");

CM.auth.globals = {

  permissions: {},

  registerRole: function (name) {

    if (CM.auth.globals.roles[name]) {

      console.log("Role already exists");
      return false;

    } else {

      CM.auth.globals.roles[name] = {

        name: name

      }

    }

  },

  registerPermission: function (permission, category) {

    if (!category || !permission) {

      console.log("Invalid paramaters");
      return false;

    }

    if (!CM.auth.globals.permissions[category]) {

      CM.auth.globals.permissions[category] = {};

    }

    if (CM.auth.globals.permissions[category][permission]) {

      console.log("Permission alreay exists");
      return false;

    } else {

      CM.auth.globals.permissions[category][permission] = {

        name: permission

      }

    }

  },

  roles: {
    admin: {
      name: "admin"
    },
    anonymous: {
      name: "anonymous"
    },
    authenticated: {
      name: "authenticated"
    },
  },
  //List of logged in users/access tokens
  userList: {},

  credentialsToPass: function (authCredentials) {

    return new Promise(function (yes, no) {

      var authPass = {

        roles: [],
        userid: null,

      };

      if (authCredentials && typeof authCredentials === "object" && authCredentials.secretkey && authCredentials.apikey) {

        if (authCredentials.secretkey === C.config.secretkey && authCredentials.apikey === C.config.apikey) {

          if (authCredentials.userid) {
            authPass.userid = authCredentials.userid;
          } else {
            authPass.userid = "root";
          }
          authPass.roles.push("admin");
          authPass.roles.push("authenticated");

        } else {

          no("Attempt at API key login with wrong credentials");
          return false;

        }

      } else if (authCredentials && typeof authCredentials === "object" && authCredentials.userid && authCredentials.token) {

        if (CM.auth.globals.checkAccessToken(authCredentials.userid, authCredentials.token)) {

          authPass.userid = authCredentials.userid;
          authPass.roles.push("authenticated");

        } else {

          no("Attempt at token and userid login with wrong credentials");
          return false;

        }

      } else {

        authPass.userid = "anonymous";
        authPass.roles = ["anonymous"];

      }

      //Run any hooks that latch onto this one to extend the authpass

      C.hook('hook_auth_authpass', authPass, authPass)
        .then(function (authPass) {

          //Complete access pass received.

          yes(authPass);
          return true;

        }, function (error) {

          //Complete access pass received.

          no(error);
          return false;

        });

    });

  },

  checkAccessToken: function (userid, token) {

    var user = CM.auth.globals.userList[userid],
      token = token,
      authenticated = false;

    if (user) {

      //Loop over tokens

      if (user.tokens[token]) {

        authenticated = true;

      }

    } else {

      authenticated = false;

    }

    return authenticated;

  },

  checkPermissions: function (permissionsArray, authPass) {

    var fs = require('fs');

    //Load in permissions

    var permissions = {};

    try {
      var currentPermissions = fs.readFileSync(CM.auth.configPath + "/permissions.JSON", "utf8");

      permissions = JSON.parse(currentPermissions);

    } catch (e) {

      console.log(e);

    }

    var access = false;

    permissionsArray.forEach(function (permission) {

      authPass.roles.forEach(function (role) {

        if (permissions[permission] && permissions[permission].indexOf(role) !== "-1") {

          access = true;

        }

      });

    });

    return access;

  },
};

CM.auth.globals.registerPermission("can make access token", "auth")
CM.auth.globals.registerPermission("can delete access token", "auth")
CM.auth.globals.registerPermission("can delete user access", "auth")

CM.auth.registerHook("hook_auth_authpass", 0, function (thisHook, data) {

  //Check if a lone userid was passed and convert it to an authenticated authPass

  if (typeof data === 'string') {

    var data = {

      userid: data,
      roles: ["authenticated"]

    }

  } else if (!data.roles || !data.userid) {

    thisHook.finish(false, "invalid authPass");
    return false;

  }

  thisHook.finish(true, data);

});


CM.auth.registerHook("hook_auth_maketoken", 0, function (thisHook, data) {

  if (!data.userid || typeof data.userid !== "string") {

    thisHook.finish(false, C.error(400, "No user ID"));
    return false;

  }

  var authToken;

  if (CM.auth.globals.checkPermissions(["can make access token"], thisHook.authPass)) {

    crypto.randomBytes(C.config.authTokenLength, function (ex, buf) {
      authToken = buf.toString('hex');

      //Create new user if not in existence

      if (!CM.auth.globals.userList[data.userid]) {
        CM.auth.globals.userList[data.userid] = {};
      }

      //Check if no tokens already set and create array

      if (!CM.auth.globals.userList[data.userid].tokens) {
        CM.auth.globals.userList[data.userid].tokens = {};
      }

      var token = {

        id: authToken,
        timestamp: Date.now()

      }

      CM.auth.globals.userList[data.userid].tokens[authToken] = token;
      thisHook.finish(true, token);

    });

  } else {

    thisHook.finish(false, C.error(403, "Access denied"));

  }

});

CM.auth.registerHook("hook_auth_deletetoken", 0, function (thisHook, data) {

  if (CM.auth.globals.checkPermissions(["can delete access token"], thisHook.authPass)) {

    if (CM.auth.globals.userList[data.userid] && CM.auth.globals.userList[data.userid].tokens) {

      //Remove the token if present

      if (CM.auth.globals.userList[data.userid].tokens[data.token]) {

        delete CM.auth.globals.userList[data.userid].tokens[data.token];

        //Clear user if no more tokens left

        if (!Object.keys(CM.auth.globals.userList[data.userid].tokens).length) {

          C.hook("hook_auth_clearauth", data.userid, thisHook.authPass);

        }

        thisHook.finish(true, data.token);

      } else {

        thisHook.finish(false, "No such token present");

      }

    } else {

      thisHook.finish(false, "No tokens present");

    }

  } else {

    thisHook.finish(false, "Access Denied");

  }

});

CM.auth.registerHook("hook_auth_clearauth", 0, function (thisHook, userid) {

  if (CM.auth.globals.checkPermissions(["can delete user access"], thisHook.authPass)) {

    if (CM.auth.globals.userList[userid]) {

      delete CM.auth.globals.userList[userid];

      thisHook.finish(true, userid);

    } else {

      thisHook.finish(false, "No tokens present");

    }

  } else {

    thisHook.finish(false, "Access Denied");

  }

});

C.app.post('/auth/clearauth', function (req, res) {

  C.hook("hook_auth_clearauth", req.body.userid, req.authPass).then(function (success) {

    res.send(success);

  }, function (fail) {

    res.send(fail);

  });

});

C.app.post('/auth/deletetoken', function (req, res) {

  C.hook("hook_auth_deletetoken", req.body, req.authPass).then(function (success) {

    res.send(success);

  }, function (fail) {

    res.send(fail);

  });

});

C.app.post('/auth/maketoken', function (req, res) {

  C.hook("hook_auth_maketoken", req.body, req.authPass).then(function (success) {

    res.respond(200, success);

  }, function (fail) {

    res.respond(fail.code, fail.message);

  });

});

C.app.get('/auth/checkauth', function (req, res) {

  res.send(req.authPass);

});

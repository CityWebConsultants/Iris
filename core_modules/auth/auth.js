/*jslint node: true */

"use strict";

var crypto = require('crypto');

C.registerModule("auth");

CM.auth.globals = {

  roles: C.include(__dirname + "/roles.js", C.configPath + "/auth/roles.js"),

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

    var user = CM.auth.globals.userlist[userid],
      token = token,
      authenticated = false;

    if (user) {

      //Loop over tokens

      user.tokens.forEach(function (element) {

        if (token === element) {

          authenticated = true;

        }

      });

    } else {

      authenticated = false;

    }

    return authenticated;

  },

  checkPermissions: function (permissionsArray, authPass) {

    var rolesArray = authPass.roles;
    var rolePermissions = [];

    Object.keys(CM.auth.globals.roles).forEach(function (role) {

      if (rolesArray.indexOf(role) !== -1) {

        CM.auth.globals.roles[role].permissions.forEach(function (permission) {

          rolePermissions.push(permission);

        });

      };

    });

    //Special case for can do anything

    if (rolePermissions.indexOf("can do anything") !== -1) {

      return true;

    } else {

      return permissionsArray.every(function (element) {

        return rolePermissions.indexOf(element) !== -1;

      });

    }

  },
};

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

    thisHook.finish(false, "No user ID");
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
        CM.auth.globals.userList[data.userid].tokens = [];
      }

      CM.auth.globals.userList[data.userid].tokens.push(authToken);
      thisHook.finish(true, authToken);

    });

  } else {

    thisHook.finish(false, "Access Denied");

  }

});

CM.auth.registerHook("hook_auth_deletetoken", 0, function (thisHook, data) {

  if (CM.auth.globals.checkPermissions(["can delete access token"], thisHook.authPass)) {

    if (CM.auth.globals.userList[data.userid] && CM.auth.globals.userList[data.userid].tokens) {

      var tokenIndex;

      CM.auth.globals.userList[data.userid].tokens.forEach(function (item, index) {

        if (item === data.token) {

          tokenIndex = index;

        }

      });

      //Remove the token if present

      if (tokenIndex) {

        CM.auth.globals.userList[data.userid].tokens.splice(tokenIndex, 1);
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

C.app.post('/auth/deletetoken', function (req, res) {

  C.hook("hook_auth_deletetoken", req.body, req.authPass).then(function (success) {

    res.send(success);

  }, function (fail) {

    res.send(fail);

  });

});

C.app.post('/auth/maketoken', function (req, res) {

  C.hook("hook_auth_maketoken", req.body, req.authPass).then(function (success) {

    res.send(success);

  }, function (fail) {

    res.send(fail);

  });

});

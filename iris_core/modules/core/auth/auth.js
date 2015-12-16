/*jslint node: true */

"use strict";

var crypto = require('crypto');

iris.registerModule("auth", true);

iris.modules.auth.globals = {

  permissions: {},

  registerRole: function (name) {

    if (iris.modules.auth.globals.roles[name]) {

      iris.log("warn", "Role already exists");
      return false;

    } else {

      iris.modules.auth.globals.roles[name] = {

        name: name

      }

    }

  },

  registerPermission: function (permission, category) {

    if (!category || !permission) {

      console.log("Invalid parameters");
      return false;

    }

    if (!iris.modules.auth.globals.permissions[category]) {

      iris.modules.auth.globals.permissions[category] = {};

    }

    if (iris.modules.auth.globals.permissions[category][permission]) {

      return false;

    } else {

      iris.modules.auth.globals.permissions[category][permission] = {

        name: permission

      }

    }

  },

  roles: {
    anonymous: {
      name: "anonymous"
    },
    authenticated: {
      name: "authenticated"
    },
  },
  //List of logged in users/access tokens
  userList: {},

  credentialsToPass: function (authCredentials, req) {

    return new Promise(function (yes, no) {

      var authPass = {

        roles: [],
        userid: null,

      };

      if (authCredentials && typeof authCredentials === "object" && authCredentials.userid && authCredentials.token) {

        if (iris.modules.auth.globals.checkAccessToken(authCredentials.userid, authCredentials.token)) {

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

      iris.hook('hook_auth_authpass', authPass, {
          req: req
        }, authPass)
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

    var user = iris.modules.auth.globals.userList[userid],
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
      var currentPermissions = fs.readFileSync(iris.modules.auth.configPath + "/permissions.JSON", "utf8");

      permissions = JSON.parse(currentPermissions);

    } catch (e) {

      fs.writeFileSync(iris.modules.auth.configPath + "/permissions.JSON", JSON.stringify({}), "utf8");

    }

    var access = false;

    permissionsArray.forEach(function (permission) {

      authPass.roles.forEach(function (role) {

        if (permissions[permission] && permissions[permission].indexOf(role) !== -1) {

          access = true;

        }

      });

    });

    if (authPass.roles.indexOf("admin") !== -1) {

      access = true;

    };

    return access;

  },
};

iris.modules.auth.globals.registerPermission("can make access token", "auth")
iris.modules.auth.globals.registerPermission("can delete access token", "auth")
iris.modules.auth.globals.registerPermission("can delete user access", "auth")

iris.modules.auth.registerHook("hook_auth_authpass", 0, function (thisHook, data) {

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


iris.modules.auth.registerHook("hook_auth_maketoken", 0, function (thisHook, data) {

  if (!data.userid || typeof data.userid !== "string") {

    thisHook.finish(false, iris.error(400, "No user ID"));
    return false;

  }

  var authToken;

  if (iris.modules.auth.globals.checkPermissions(["can make access token"], thisHook.authPass)) {

    crypto.randomBytes(16, function (ex, buf) {
      authToken = buf.toString('hex');

      //Create new user if not in existence

      if (!iris.modules.auth.globals.userList[data.userid]) {

        iris.modules.auth.globals.userList[data.userid] = {};

      }

      //Check if no tokens already set and create array

      if (!iris.modules.auth.globals.userList[data.userid].tokens) {

        iris.modules.auth.globals.userList[data.userid].tokens = {};

      }

      var token = {

        id: authToken,
        timestamp: Date.now()

      }

      iris.modules.auth.globals.userList[data.userid].tokens[authToken] = token;
      thisHook.finish(true, token);

    });

  } else {

    thisHook.finish(false, iris.error(403, "Access denied"));

  }

});

iris.modules.auth.registerHook("hook_auth_deletetoken", 0, function (thisHook, data) {

  if (iris.modules.auth.globals.checkPermissions(["can delete access token"], thisHook.authPass)) {

    if (iris.modules.auth.globals.userList[data.userid] && iris.modules.auth.globals.userList[data.userid].tokens) {

      //Remove the token if present

      if (iris.modules.auth.globals.userList[data.userid].tokens[data.token]) {

        delete iris.modules.auth.globals.userList[data.userid].tokens[data.token];

        //Clear user if no more tokens left

        if (!Object.keys(iris.modules.auth.globals.userList[data.userid].tokens).length) {

          iris.hook("hook_auth_clearauth", data.userid, thisHook.authPass);

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

iris.modules.auth.registerHook("hook_auth_clearauth", 0, function (thisHook, userid) {

  if (iris.modules.auth.globals.checkPermissions(["can delete user access"], thisHook.authPass)) {

    if (iris.modules.auth.globals.userList[userid]) {

      delete iris.modules.auth.globals.userList[userid];

      thisHook.finish(true, userid);

    } else {

      thisHook.finish(false, "No tokens present");

    }

  } else {

    thisHook.finish(false, "Access Denied");

  }

});

iris.app.post('/auth/clearauth', function (req, res) {

  iris.hook("hook_auth_clearauth", req.body.userid, req.authPass).then(function (success) {

    res.send(success);

  }, function (fail) {

    res.send(fail);

  });

});

iris.app.post('/auth/deletetoken', function (req, res) {

  iris.hook("hook_auth_deletetoken", req.body, req.authPass).then(function (success) {

    res.send(success);

  }, function (fail) {

    res.send(fail);

  });

});

iris.app.post('/auth/maketoken', function (req, res) {

  iris.hook("hook_auth_maketoken", req.body, req.authPass).then(function (success) {

    res.respond(200, success);

  }, function (fail) {

    res.respond(fail.code, fail.message);

  });

});

iris.app.get('/auth/checkauth', function (req, res) {

  res.send(req.authPass);

});

Object.observe(iris.modules.auth.globals.userList, function (data) {

  process.send({
    sessions: iris.modules.auth.globals.userList
  });

});

iris.app.post("/logout", function (req, res) {

  iris.hook("hook_auth_clearauth", "root", null, req.authPass.userid);

  res.send("logged out");

});

/*jshint nomen: true, node:true */
/* globals iris,mongoose,Promise*/

"use strict";

var fs = require('fs');

var mkdirSync = function (path) {
  try {
    fs.mkdirSync(path);
  } catch (e) {
    if (e.code !== 'EEXIST') {
      throw e;
    }

  }
};

mkdirSync(iris.configPath + "/" + "auth");

/**
 * @file Methods and hooks for managing user authentication
 */

/**
 * @namespace auth
 */

var crypto = require('crypto');

iris.registerModule("auth");

iris.modules.auth.globals = {

  permissions: {},

  registerRole: function (name) {

    if (iris.modules.auth.globals.roles[name]) {

      iris.log("warn", "Role already exists");
      return false;

    } else {

      iris.modules.auth.globals.roles[name] = {

        name: name

      };

    }

  },

  registerPermission: function (permission, category, description) {

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

        name: permission,
        description: description

      };

    }

  },

  roles: {
    anonymous: {
      name: "anonymous"
    },
    authenticated: {
      name: "authenticated"
    }
  },

  //List of logged in users/access tokens
  userList: {},

  credentialsToPass: function (authCredentials, req, res) {

    return new Promise(function (yes, no) {

      var authPass = {

        roles: [],
        userid: null

      };

      if (authCredentials && typeof authCredentials === "object" && authCredentials.userid && authCredentials.token) {

        if (iris.modules.auth.globals.checkAccessToken(authCredentials.userid, authCredentials.token)) {

          authPass.userid = authCredentials.userid;
          authPass.roles.push("authenticated");

          // Remove anonymous role

          if (authPass.roles.indexOf("anonymous") !== -1) {

            authPass.roles.splice(authPass.roles.indexOf("anonymous"), 1);

          }

        } else {

          no("Attempt at token and userid login with wrong credentials");
          return false;

        }

      } else {

        authPass.userid = "anonymous";
        authPass.roles = ["anonymous"];

      }

      //Run any hooks that latch onto this one to extend the authpass

      iris.invokeHook('hook_auth_authpass', authPass, {
        req: req,
        res: res
      }, authPass).then(function (authPass) {

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

    var fs = require('fs'),
      permissions;

    //Load in permissions if available

    try {
      var currentPermissions = fs.readFileSync(iris.sitePath + "/configurations/auth/permissions.json", "utf8");

      permissions = JSON.parse(currentPermissions);

    } catch (e) {

      permissions = {};

    }

    var access = false;

    permissionsArray.forEach(function (permission) {

      authPass.roles.forEach(function (role) {

        if (permissions[permission] && permissions[permission].indexOf(role) !== -1) {

          access = true;

        }

      });

    });

    if (authPass.roles.indexOf("admin") >= 0) {

      access = true;

    }

    return access;

  }
};

iris.modules.auth.globals.registerPermission("can make access token", "auth");
iris.modules.auth.globals.registerPermission("can delete access token", "auth");
iris.modules.auth.globals.registerPermission("can delete user access", "auth");

/**
 * @member hook_auth_authpass
 * @memberof auth
 *
 * @desc Get or update an authpass
 *
 * If data is a string, it will be treated as a userid and an authPass will be prepared from it.
 */
iris.modules.auth.registerHook("hook_auth_authpass", 0, function (thisHook, data) {

  //Check if a lone userid was passed and convert it to an authenticated authPass

  if (typeof data === 'string') {

    data = {

      userid: data,
      roles: ["authenticated"]

    };

  } else if (!data.roles || !data.userid) {

    thisHook.fail("invalid authPass");
    return false;

  }

  // This is required to add i18n to the authPass object. This allows each user to have a separate language set for
  // their request. It's an alternative to passing the req object everywhere.
  // Translated text can be achieved by thisHook.authPass.t('Text to translate');
  // To change the users language, use hook_auth_authpass and then thisHook.authPass.setLocale([language code]);
  if (thisHook.req && thisHook.req.headers && thisHook.req.headers['accept-language']) {

    data.headers = {'accept-language' : thisHook.req.headers['accept-language']};

  }
  else {

    data.headers = {'accept-language' : 'en-US,en'};

  }

  iris.i18n.init(data);

  thisHook.pass(data);

});


iris.modules.auth.registerHook("hook_auth_maketoken", 0, function (thisHook, data) {

  /*if(iris.modules.auth.globals.userList[data.userid]) {
    thisHook.pass("Already authenticated");
    return true;
  }*/

  if (!data.userid || typeof data.userid !== "string") {

    thisHook.fail(iris.error(400, "No user ID"));
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

      };

      iris.modules.auth.globals.userList[data.userid].tokens[authToken] = token;
      
      iris.invokeHook("hook_user_login", thisHook.authPass, null, data.userid).then(function(success) {
        thisHook.pass(success);
      }, function (fail) {

        thisHook.fail(fail);

      });

      iris.modules.auth.globals.userList[data.userid].getAuthPass = function () {

        var token = Object.keys(iris.modules.auth.globals.userList[data.userid].tokens)[0];
        var userid = data.userid;

        return new Promise(function (pass, fail) {

          iris.modules.auth.globals.credentialsToPass({
            userid: userid,
            token: token
          }).then(function (authPass) {

            pass(authPass);

          }, function (reason) {

            fail(reason);

          });


        });

      };

      iris.modules.auth.globals.userList[data.userid].lastActivity = Date.now();

      thisHook.pass(token);

    });


  } else {

    thisHook.fail(iris.error(403, "Access denied"));

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

          iris.invokeHook("hook_auth_clearauth", data.userid, thisHook.authPass);

        }

        thisHook.pass(data.token);

      } else {

        thisHook.fail("No such token present");

      }

    } else {

      thisHook.fail("No tokens present");

    }

  } else {

    thisHook.fail("Access Denied");

  }

});

iris.modules.auth.registerHook("hook_auth_clearauth", 0, function (thisHook, userid) {

  if (iris.modules.auth.globals.checkPermissions(["can delete user access"], thisHook.authPass)) {

    if (iris.modules.auth.globals.userList[userid]) {

      iris.invokeHook("hook_user_logout", thisHook.authPass, null, userid).then(function(success){
        thisHook.pass(success);
      }, function(fail) {

        thisHook.fail(fail);

      });
      delete iris.modules.auth.globals.userList[userid];
       
      thisHook.pass(userid);

    } else {

      thisHook.fail("No tokens present");

    }

  } else {

    thisHook.fail("Access Denied");

  }

});

iris.app.post('/auth/clearauth', function (req, res) {

  iris.invokeHook("hook_auth_clearauth", req.authPass, req.body.userid, req.body.userid).then(function (success) {

    res.send(success);

  }, function (fail) {

    res.send(fail);

  });

});

iris.app.post('/auth/deletetoken', function (req, res) {

  iris.invokeHook("hook_auth_deletetoken", req.authPass, req.body, req.authPass).then(function (success) {

    res.send(success);

  }, function (fail) {

    res.send(fail);

  });

});

iris.app.post('/auth/maketoken', function (req, res) {
  
  iris.invokeHook("hook_auth_maketoken", req.authPass, null, {
    userid: req.body.userid
  }).then(function (success) {

    res.respond(200, success);

  }, function (fail) {

    res.send(fail);

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

  iris.invokeHook("hook_auth_clearauth", "root", null, req.authPass.userid);

  res.send("logged out");

});

// Check permissions on menu callbacks

iris.modules.auth.registerHook("hook_request_intercept", 0, function (thisHook, data) {

  // Check if a matching route is found

  if (thisHook.context.req.irisRoute && thisHook.context.req.irisRoute.options && thisHook.context.req.irisRoute.options.permissions) {

    var permissions = thisHook.context.req.irisRoute.options.permissions;

    var access = iris.modules.auth.globals.checkPermissions(permissions, thisHook.context.req.authPass);

    if (!access) {

      iris.invokeHook("hook_display_error_page", thisHook.context.req.authPass, {
        error: 403,
        req: thisHook.context.req
      }).then(function (success) {

        thisHook.context.res.send(success);

        thisHook.fail(data);

      }, function (fail) {

        thisHook.context.res.status(403);
        thisHook.context.res.end(403);
        thisHook.fail(data);

      });

    } else {

      thisHook.pass(data);

    }

  } else {

    thisHook.pass(data);

  }

});

/*jslint node: true */

"use strict";

/*  Auth Module
 *
 *  Provides an authentication API for integrating with a user management system
 *  (i.e. Drupal or some other CMS). Accepts the global secret key and a user ID
 *  and returns an authentication token and saves the user ID and token pair.
 *
 *  Implements the base hook hook_auth_check.
 *  Implements an API endpoint hook_post_auth (/auth)
 */

var crypto = require('crypto');

var exports = {
  //List of logged in users/access tokens
  userlist: {},
  // A side effect of declaring this object is that you can have default options!
  options: {
    token_length: 16,
    allowdebug: false
  },
  // Global functions
  globals: {
    credentialsToPass: function (authCredentials) {

      return new Promise(function (yes, no) {

        var authPass = {

          roles: [],
          userid: null,

        };

        if (authCredentials.secretkey && authCredentials.apikey) {

          if (authCredentials.secretkey === process.config.secretkey && authCredentials.apikey === process.config.apikey) {

            if (authCredentials.userid) {
              authPass.userid = authCredentials.userid;
            }
            authPass.roles.push("admin");
            authPass.roles.push("authenticated");

          } else {

            no("Attempt at API key login with wrong credentials");
            return false;

          }

        } else if (authCredentials.userid && authCredentials.token) {

          if (C.auth.checkAccessToken(authCredentials.userid, authCredentials.token)) {

            authPass.userid = authCredentials.userid;
            authPass.roles.push("authenticated");

          } else {

            no("Attempt at token and userid login with wrong credentials");
            return false;

          }

        } else {

          authPass.roles = ["anonymous"];
          yes(authPass);
          return true;

        }

        //If function gets to this point the user is either admin or an ordinary authenticated user.

        //Run any hooks that latch onto this one to extend the authpass
        
        hook('hook_authpass', authPass, authPass)
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

      var user = exports.userlist[userid],
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

      Object.keys(roles).forEach(function (role) {

        if (rolesArray.indexOf(role) !== -1) {

          roles[role].permissions.forEach(function (permission) {

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
  },
  hook_authpass: {
    rank: 0,
    event: function (thisHook, data) {

      //Check if a lone userid was passed and convert it to an authenticated authPass

      if (typeof data === 'string' || data instanceof String) {

        var data = {

          userid: data,
          roles: ["authenticated"]

        }

      } else if (!data.roles || !data.userid) {

        thisHook.finish(false, "invalid authPass");
        return false;

      }
      
      thisHook.finish(true, data);

    }
  },
  // POST /auth
  hook_post_auth_maketoken: {
    rank: 0,
    event: function (thisHook, data) {
            
      if (!data.userid) {

        thisHook.finish(false, "No user ID");
        return false;

      }

      var authToken;

      if (C.auth.checkPermissions(["can make access token"], thisHook.authPass)) {

        crypto.randomBytes(exports.options.token_length, function (ex, buf) {
          authToken = buf.toString('hex');

          //Create new user if not in existence

          if (!exports.userlist[data.userid]) {
            exports.userlist[data.userid] = {};
          }

          //Check if no tokens already set and create array

          if (!exports.userlist[data.userid].tokens) {
            exports.userlist[data.userid].tokens = [];
          }

          exports.userlist[data.userid].tokens.push(authToken);
          thisHook.finish(true, authToken);

        });

      } else {

        thisHook.finish(false, "Access Denied");

      }

    }
  }
}

process.userlist = exports.userlist;

module.exports = exports;

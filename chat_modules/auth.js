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
    getPermissionsLevel: function (data) {

      if (data.secretkey && data.apikey) {

        if (data.secretkey === process.config.secretkey && data.apikey === process.config.apikey) {

          return 2;

        }

      }

      if (data.userid && data.token) {

        if (C.auth.checkAccessToken(data.userid, data.token)) {

          return 1;

        }

      }

      return 0;

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
  },
  checkPermissions: function (permissionsArray, rolesArray) {

    var rolePermissions = [];

    Object.keys(roles).forEach(function (role) {
      if (rolesArray.indexOf(role) !== -1) {

        roles.permissions.forEach(function (permission) {

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
  // POST /auth
  hook_post_auth_maketoken: {
    rank: 0,
    event: function (data) {

      if (!data.post.userid) {

        data.returns = "No userid supplied";
        process.emit("next", data);
        return false;

      }

      var authToken;

      if (data.auth > 1) {

        crypto.randomBytes(exports.options.token_length, function (ex, buf) {
          authToken = buf.toString('hex');

          //Create new user if not in existence

          if (!exports.userlist[data.post.userid]) {
            exports.userlist[data.post.userid] = {};
          }

          //Check if no tokens already set and create array

          if (!exports.userlist[data.post.userid].tokens) {
            exports.userlist[data.post.userid].tokens = [];
          }

          exports.userlist[data.post.userid].tokens.push(authToken);
          data.returns = authToken;
          process.emit('next', data);
        });
      } else {

        data.returns = "Secret key pair invalid.";
        process.emit("next", data);

      }

    }
  }
}

process.userlist = exports.userlist;

module.exports = exports;

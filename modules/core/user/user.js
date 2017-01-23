/**
 * @file User management module
 */

/**
 * @namespace user
 */

iris.registerModule("user", __dirname);
var bcrypt = require("bcrypt-nodejs");
require('./login_form.js');

/**
 * Define callback routes.
 */
var routes = {
  login: {
    title: "Login",
    description: "User login page."
  },
  password: {
    title: "Password reset",
    description: "Request a password-reset email"
  },
  reset: {
    title: "One-time login",
    description: "Reset your lost password"
  },
  users: {
    title: "Users",
    "menu": [{
      menuName: "admin_toolbar",
      parent: null,
      title: "Users",
      weight: 5
    }]
  },
  logout: {
    "menu": [{
      menuName: "admin_toolbar",
      parent: null,
      title: "Logout",
      weight: 8
    }]
  }
};

/**
 * Page callback: User login page.
 */
iris.route.get("/user/login", routes.login, function (req, res) {

  if (isNaN(req.authPass.userid)) {
    iris.modules.frontend.globals.parseTemplateFile(["login"], ['html'], {}, req.authPass, req).then(function (success) {

      res.send(success);

    }, function (fail) {

      iris.modules.frontend.globals.displayErrorPage(500, req, res);

      iris.log("error", fail);

    });
  } else {
    res.redirect('/user');
  }

});

/**
 * Page callback: User login page.
 */
iris.route.get("/user/password", routes.password, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["passwordReset"], ['html'], {}, req.authPass, req).then(function (success) {

    res.send(success);

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

// Username + password to token

iris.route.post("/api/login", function (req, res) {

  if (req.body.username && req.body.password) {

    iris.modules.user.globals.login(req.body, null, function (userid, token) {

      if (!userid) {

        res.status(403).send(req.authPass.t("Not valid credentials"));

      } else {

        res.send({
          userid: userid,
          token: token
        });

      }

    });

  } else {

    res.status(400).send(req.authPass.t("Must send username and password"));

  }

});

iris.route.get("/admin/users", routes.users, function (req, res) {

  var menu = iris.modules.menu.globals.getBaseLinks(req.url);

  iris.modules.frontend.globals.parseTemplateFile(["baselinks"], ['admin_wrapper'], {
    menu: menu,
  }, req.authPass, req).then(function (success) {

    res.send(success);

  });

});

/**
 * Page callback: User page.
 */
iris.route.get("/user", {}, function (req, res) {

  if (req.authPass.roles.indexOf('authenticated') == -1) {
    // Anonymous. Redirect to login page.
    res.redirect('/user/login');
  } else {
    // Redirect to own user page.
    res.redirect('/user/' + req.authPass.userid);
  }
});

/**
 * Password reset callback.
 */
iris.route.get("/user/reset/*", routes.reset, function (req, res) {

  var params = req.params[0].split('/');

  // Time out, in seconds, until login URL expires. Defaults to 24 hours =
  // 86400 seconds.
  var timeout = 86400000,
    current = Date.now(),
    timestamp = params[1],
    eid = params[0],
    hashed_pass = params[2],
    action = '';
  if (params[3]) {
    action = params[3];
  }

  iris.invokeHook("hook_entity_fetch", "root", null, {
    "entities": ["user"],
    "queries": [{
      "field": "eid",
      "operator": "is",
      "value": eid
      }]
  }).then(function (entities) {

    var account;

    if (entities) {

      account = entities[0];

    }

    var data = timestamp + account.lastlogin.toString() + account.eid;
    var rehash = iris.hmacBase64(data, account.password);

    if (timestamp <= current && account) {
      // No time out for first time login.
      if (account.lastlogin && current - timestamp > timeout) {
        iris.message(req.authPass.userid, req.authPass.t('You have tried to use a one-time login link that has expired. Please request a new one using the form below.'), 'error');
        res.redirect('/user/password');
      } else if (account.eid && timestamp >= account.lastlogin && timestamp <= current && hashed_pass == rehash) {
        // First stage is a confirmation form, then login
        if (action == 'login') {

          // Login user

          iris.invokeHook("hook_auth_maketoken", "root", null, {
            userid: eid
          }).then(function (token) {

            req.session.credentials = {
              "userid": eid,
              token: token
            };

            // Add last login timestamp to user entity.

            var userEntity = {
              entityType: "user",
              eid: eid,
              lastlogin: Date.now()
            };

            iris.invokeHook("hook_entity_edit", "root", null, userEntity);

            iris.log('notice', 'User %name used one-time login link at time %timestamp.');
            iris.message(req.authPass.userid, req.authPass.t('You have just used your one-time login link. It is no longer necessary to use this link to log in. Please change your password.'));

            // Redirect
            res.redirect('/user/' + account.eid + '/edit');

          }, function (fail) {

            iris.log("error", fail);

          });

        } else {

          var future = parseInt(timestamp) + parseInt(timeout);
          var expireDate = new Date(parseInt(future));

          expireDate = expireDate.getDate() + '/' + (expireDate.getMonth() + 1) + '/' + expireDate.getFullYear() + ' ' + expireDate.getHours() + ':' + expireDate.getMinutes();

          iris.modules.frontend.globals.parseTemplateFile(["passwordResetPrompt"], ['html'], {
            link: '/user/reset/' + eid + '/' + timestamp + '/' + hashed_pass + '/login',
            text: req.authPass.t("<p>This is a one-time login for {{username}} and will expire on {{expiration_date}}.</p><p>Click on this button to log in to the site and change your password.</p>", {
              username: account.username,
              expiration_date: expireDate
            })
          }, req.authPass, req).then(function (success) {

            res.send(success);
            return;

          }, function (fail) {

            iris.log('error', fail);
            res.redirect('/user/password');

          });



        }
      } else {

        res.redirect('/user/password');

      }

    }

    /* iris.modules.frontend.globals.parseTemplateFile(["baselinks"], ['admin_wrapper'], {
      menu: menu,
    }, req.authPass, req).then(function (success) {

      res.send(success);

    });
*/
  });

});

/**
 * Page callback.
 * User logout.
 */

iris.route.get("/user/logout", routes.logout, function (req, res) {

  var logout = function () {

    delete iris.modules.auth.globals.userList[req.authPass.userid];

    if (req.session) {
      req.session.destroy(function () {

        res.redirect("/");

      });
    }
    else {
      res.redirect("/");
    }

  };

  iris.invokeHook("hook_user_logout", req.authPass, null, res).then(function (success) {

    res = success;
    logout();

  }, function (fail) {

    logout();

  });

});

/**
 * API POST
 * First ever login form.
 * Set up first user account via API.
 */
iris.route.post("/api/user/first", function (req, res) {

  if (!req.body.password || !req.body.username) {

    res.status(400).json(req.authPass.t("Need to supply a username and a password"));

    return false;

  }

  iris.invokeHook("hook_entity_fetch", "root", null, {
    "entities": ["user"]
  }).then(function (entities) {

    if (!entities || entities.length === 0) {

      iris.invokeHook("hook_form_submit__set_first_user", "root", {
        params: {
          password: req.body.password,
          username: req.body.username
        }
      }, null).then(function (success) {

        res.status(200).json(req.authPass.t("First user created"));

      }, function (fail) {

        res.status(400).json(fail);

      });

    } else {

      res.status(403).json("Admin user already set up");

    }

  });

});

/**
 * First ever login page (should only show if no user has been set up).
 */
iris.route.get("/", function (req, res, next) {

  iris.invokeHook("hook_entity_fetch", "root", null, {
    "entities": ["user"]
  }).then(function (entities) {

    if (!entities || entities.length === 0) {

      iris.modules.frontend.globals.parseTemplateFile(["first_user"], null, {}, req.authPass, req).then(function (success) {

        res.send(success);

      }, function (fail) {

        iris.modules.frontend.globals.displayErrorPage(500, req, res);

        iris.log("error", e);

      });

    } else {

      next();

    }
  });
});

/**
 * Defines form passwordReset.
 * First time login creates admin account.
 */
iris.modules.user.registerHook("hook_form_render__passwordReset", 0, function (thisHook, data) {

  var ap = thisHook.authPass;

  data.schema.username = {
    "type": "string",
    "title": ap.t("Enter email address"),
    "description": ap.t('An email will be sent for you to complete the process')
  };

  thisHook.pass(data);

});

/**
 * Submit handler for passwordReset.
 */
iris.modules.user.registerHook("hook_form_validate__passwordReset", 0, function (thisHook, data) {

  iris.invokeHook("hook_entity_fetch", "root", null, {
    "entities": ["user"],
    "queries": [{
      "field": "username",
      "operator": "is",
      "value": thisHook.context.params.username
      }]
  }).then(function (entities) {

    if (entities) {

      var doc = entities[0];

    } else {

      data.errors.push({
        field: 'username',
        message: thisHook.authPass.t('Email address not recognised.')
      });

    }

    thisHook.pass(data);
  });
});

/**
 * Submit handler for passwordReset.
 */
iris.modules.user.registerHook("hook_form_submit__passwordReset", 0, function (thisHook, data) {

  iris.invokeHook("hook_entity_fetch", "root", null, {
    "entities": ["user"],
    "queries": [{
      "field": "username",
      "operator": "is",
      "value": thisHook.context.params.username
      }]
  }).then(function (entities) {

    var doc;

    if (entities) {

      doc = entities[0];

    }

    var date = Date.now().toString();
    var eid = doc.eid;
    var hash = date + doc.lastlogin.toString() + eid;
    var key = doc.password;

    // TODO : Simplify construction of urls, need to know if http or https etc.
    var link = 'http://' + thisHook.req.headers.host + "/user/reset/" + eid + "/" + date + "/" + iris.hmacBase64(hash, key);

    iris.modules.frontend.globals.parseTemplateFile(["emailPasswordReset"], null, {
      "one-time-login-url": link,
      "name": doc.username,
      "sitename": thisHook.req.headers.host
    }, thisHook.req.authPass, thisHook.req).then(function (body) {

      var email;

      if (!iris.config.siteEmail) {

        email = "irisjs@irisjs.org";

      } else {

        email = iris.config.siteEmail;

      }

      var args = {
        from: email,
        to: thisHook.context.params.username,
        subject: 'Password reset',
        body: body
      };

      iris.modules.email.globals.sendEmail(args, thisHook.authPass);

      thisHook.pass(data);

    }, function (fail) {

      iris.log("error", fail);

      data.errors.push({
        'field': 'username',
        'message': fail
      });
      thisHook.pass(data);

    });


  });

});

/**
 * Defines form set_first_user.
 * First time login creates admin account.
 */
iris.modules.user.registerHook("hook_form_render__set_first_user", 0, function (thisHook, data) {

  var ap = thisHook.authPass;

  iris.invokeHook("hook_entity_fetch", "root", null, {
    "entities": ["user"]
  }).then(function (entities) {

    if (!entities || entities.length === 0) {

      data.schema.profile = {
        "type": "string",
        "title": ap.t("Installation profile"),
        "enum": ["minimal", "standard"]
      };

      data.schema.username = {
        "type": "text",
        "title": ap.t("Administrator email address")
      };

      data.schema.password = {
        "type": "password",
        "title": ap.t("Password")
      };

      data.form = [
        {
          "key": "profile",
          "description": ap.t("The Minimal profile will exclude all optional UI modules and features. In a Minimal setup, " +
            "Iris can be used as a lightweight webservice.<br/>Use Standard profile to build a user-facing CMS type system.<br/>" +
            "If choosing Standard, please wait after clicking 'Install' for the server to restart. The blank page is expected."),
          "titleMap": {
            "minimal": ap.t("Minimal"),
            "standard": ap.t("Standard")
          }
        },
        {
          "key": "username",
          "type": "email",
          "description": ap.t("Use this to login with in future")
        },
        'password',
        {
          "type": "submit",
          "title": ap.t("Install")
        }
      ];

      thisHook.pass(data);

    } else {

      thisHook.fail(data);

    }
  });

});


/**
 * Submit handler for set_first_user.
 */
iris.modules.user.registerHook("hook_form_submit__set_first_user", 0, function (thisHook, data) {

  var ap = thisHook.authPass;

  iris.invokeHook("hook_entity_fetch", "root", null, {
    "entities": ["user"]
  }).then(function (entities) {

    if (!entities || entities.length === 0) {

      var newUser = {

        entityType: "user",
        entityAuthor: "system",
        password: thisHook.context.params.password,
        username: thisHook.context.params.username,
        roles: ["admin"]
      };

      iris.invokeHook("hook_entity_create", "root", newUser, newUser).then(function (user) {

        var auth = {
          password: thisHook.context.params.password,
          username: thisHook.context.params.username
        };

        iris.modules.user.globals.login(auth, thisHook.context.req, function (uid) {

          var enabled = [];

          if (thisHook.context.params.profile == 'standard') {

            enabled = [
              {
                "name": "menu_ui"
              }, {
                "name": "autopath"
              }, {
                "name": "entityReference"
              }, {
                "name": "page"
              }, {
                "name": "configUI"
              }, {
                "name": "roles_ui"
              }, {
                "name": "entityUI"
              }, {
                "name": "permissionsUI"
              }, {
                "name": "blocks"
              }, {
                "name": "triggers"
              }, {
                "name": "menu_block"
              }, {
                "name": "regions"
              }, {
                "name": "custom_blocks"
              }, {
                "name": "textfilters"
              }, {
                "name": "ckeditor"
              }, {
                "name": "tags"
              }
            ];

            iris.saveConfigSync(enabled, "system", "enabled_modules", true);

          }

          if (enabled) {

            console.log('restarting');
            iris.restart(thisHook.authPass, {});

          }

          iris.message(uid, ap.t("Welcome to your new Iris site!"), "info");
          data.callback = '/admin';
          data.restart = true;

          thisHook.pass(data);
        });

      }, function (fail) {

        iris.log("error", fail);
        thisHook.fail(data);

      });

    } else {

      thisHook.fail(data);

    }

  });

});


/**
 * @function login
 * @memberof user
 *
 * @desc Login a user given a login object (containing username and password)
 *
 * @param {object} auth - Auth object consisting of key-value pairs username and password
 * @param {object} res - Express response object
 * @param {function} callback - Callback which is run with the userid of the logged in user (if successful) as its first argument, or, if unsuccessful, an error message
 */
iris.modules.user.globals.login = function (auth, req, callback) {

  iris.invokeHook("hook_entity_fetch", "root", null, {
    "entities": ["user"],
    "queries": [{
      "field": "username",
      "operator": "is",
      "value": auth.username
      }]
  }).then(function (entities) {

    if (entities && entities[0]) {

      var doc = entities[0];

      var userid = doc.eid.toString();

      bcrypt.compare(auth.password, doc.password, function (err, match) {

        if (!err && match === true) {

          iris.invokeHook("hook_auth_maketoken", "root", null, {
            userid: userid
          }).then(function (token) {

            if (req) {

              req.session.credentials = {
                userid: userid,
                token: token.id
              };

              // Add last login timestamp to user entity.

              var userEntity = {
                entityType: "user",
                eid: userid,
                lastlogin: Date.now()
              };

              iris.invokeHook("hook_entity_edit", "root", null, userEntity);

              callback(userid);

            } else {

              callback(userid, token.id);

            }

          }, function (fail) {

            iris.log("error", fail);

          });

        } else {

          callback(false);

        }

      });

    } else {

      callback(false);

    }

  }, function (fail) {

    iris.log("error", fail);

  });

};

iris.modules.user.registerHook("hook_entity_presave", 1, function (thisHook, entity) {

  if (entity.password && entity.password.length) {

    bcrypt.hash(entity.password, null, null, function (err, hash) {

      if (err) {

        thisHook.fail("Could not hash password");

      } else {

        entity.password = hash;
        thisHook.pass(entity);

      }

    });

  } else {

    // If password is blank or not set, don't bother hashing it

    // When editing a user, this results in a blank password
    // meaning "keep the same password"

    delete entity.password;

    thisHook.pass(entity);

  }

  // Change roles in cache

  iris.modules.user.globals.userRoles[entity.eid] = entity.roles;

});

iris.modules.user.globals.userRoles = {};

/**
 * @function getRole
 * @memberof user
 *
 * @desc Fetch the roles that a user has given their userid.
 *
 * @param {string} userid - The userid
 * @param {function} callback - The callback which is run with the user's roles as its first argument
 */
iris.modules.user.globals.getRole = function (userid, callback) {

  if (iris.modules.user.globals.userRoles[userid]) {

    callback(iris.modules.user.globals.userRoles[userid]);

  } else {

    iris.invokeHook("hook_entity_fetch", "root", null, {
      "entities": ["user"],
      "queries": [{
        "field": "eid",
        "operator": "is",
        "value": parseInt(userid)
      }]
    }).then(function (entities) {

      var doc;

      if (entities) {

        doc = entities[0];

      }

      if (doc) {

        iris.modules.user.globals.userRoles[userid] = doc.roles;

        callback(doc.roles);

      } else {

        callback([]);

      }

    });

  }

};

iris.modules.user.registerHook("hook_auth_authpass", 5, function (thisHook, data) {

  if (data.roles && data.roles.indexOf('authenticated') !== -1) {

    iris.modules.user.globals.getRole(thisHook.authPass.userid, function (roles) {

      data.roles = data.roles.concat(roles);

      thisHook.pass(data);

    });

  } else {

    thisHook.pass(data);

  }

});

iris.modules.user.registerHook("hook_entity_updated", 1, function (thisHook, entity) {

  if (entity.entityType === 'user' && entity.userid) {

    if (iris.modules.user.globals.userRoles[entity.userid]) {

      delete iris.modules.user.globals.userRoles[entity.userid];

    }

  }

  thisHook.pass(entity);

});

/**
 * We don't want to change the lastlogin value after updating a user via the admin form so remove it from the object.
 */
iris.modules.user.registerHook("hook_entity_presave_user", 1, function (thisHook, data) {

  if (data.lastlogin === null) {

    delete data.lastlogin;

  }

  thisHook.pass(data);

});

// Blank password field on entity edit

// Prepopulate roles

iris.modules.user.registerHook("hook_form_render__entity", 1, function (thisHook, data) {

  if (thisHook.context.params[1] === "user" && data.schema && data.schema.password) {

    data.schema.password.default = null;
    data.schema.password.required = false;
    data.schema.password.title = thisHook.authPass.t("Change password");
    data.schema.password.description = thisHook.authPass.t("Change your password by typing a new one into the form below");

    // This fields should not be editable by users.
    delete data.schema.lastlogin;

    for (var i = 0; i < data.form.length; i++) {

      if (data.form[i] == 'lastlogin') {

        data.form.splice(i, 1);
        break;

      }

    }

    // TODO: Roles should only show if user has permission.
    var roles = ["none", "admin"];
    Object.keys(iris.modules.auth.globals.roles).forEach(function (role) {

      if (role !== "anonymous" && role !== "authenticated") {
        roles.push(role);
      }

    });

    data.schema.roles.items = {
      type: "string",
      enum: roles
    };

  }

  thisHook.pass(data);

});

iris.modules.user.registerHook("hook_form_render__createEntity", 1, function (thisHook, data) {

  if (thisHook.context.params[1] === "user") {

    var roles = ["none", "admin"];
    Object.keys(iris.modules.auth.globals.roles).forEach(function (role) {

      if (role !== "anonymous" && role !== "authenticated") {
        roles.push(role);
      }

    });

    data.schema.roles.items = {
      type: "string",
      enum: roles
    };

  }

  thisHook.pass(data);

});

// When creating user, change the author to the entity ID
// TODO: Check if this is wise.

iris.modules.user.registerHook("hook_entity_created_user", 0, function (thisHook, data) {

  var update = {
    eid: data.eid,
    entityAuthor: data.eid,
    entityType: "user"
  };

  iris.invokeHook("hook_entity_edit", "root", null, update).then(function () {

    thisHook.pass(data);

  }, function (fail) {

    thisHook.fail(fail);

  });

});

// Check if websocket connection has authentication cookies

iris.modules.user.registerHook("hook_socket_connect", 0, function (thisHook, data) {

  if (thisHook.context.socket.handshake.session && thisHook.context.socket.handshake.session.credentials) {

    iris.socketLogin(thisHook.context.socket.handshake.session.credentials.userid, thisHook.context.socket.handshake.session.credentials.token, thisHook.context.socket, function () {

      thisHook.pass(data);

    });

  } else {

    thisHook.pass(data);
  }

});

// Delete user from auth list if deleted

iris.modules.user.registerHook("hook_entity_deleted", 1, function (thisHook, entity) {

  if (entity.entityType === "user") {

    delete iris.modules.auth.globals.userList[entity.eid];

  }

  thisHook.pass(entity);

});

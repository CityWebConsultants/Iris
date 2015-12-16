iris.registerModule("user");

var bcrypt = require("bcrypt-nodejs");

// First ever login form

iris.modules.user.registerHook("hook_form_render_set_first_user", 0, function (thisHook, data) {

  iris.dbCollections["user"].count({}, function (err, count) {
    if (count === 0) {

      data.schema.username = {
        "type": "text",
        "title": "username"
      }

      data.schema.password = {
        "type": "password",
        "title": "Password",
        "description": "Make it strong"
      };

      thisHook.finish(true, data);

    } else {

      thisHook.finish(false, data);

    }
  });

})

iris.modules.user.registerHook("hook_form_submit_set_first_user", 0, function (thisHook, data) {

  iris.dbCollections["user"].count({}, function (err, count) {
    if (count === 0) {

      var user = {

        entityType: "user",
        entityAuthor: "system",
        password: thisHook.const.params.password,
        username: thisHook.const.params.username,
        roles: ["admin"]
      }

      iris.hook("hook_entity_create", "root", user, user).then(function (user) {

        thisHook.finish(true, data);

      }, function (fail) {

        console.log(fail);

      })

    } else {

      thisHook.finish(false, data);

    }

  });

})

// First ever login page (should only show if no user has been set up)

iris.app.get("/", function (req, res, next) {

  iris.dbCollections["user"].count({}, function (err, count) {
    if (count === 0) {

      iris.modules.frontend.globals.parseTemplateFile(["first_user"], null, {}, req.authPass, req).then(function (success) {

        res.send(success)

      }, function (fail) {

        iris.modules.frontend.globals.displayErrorPage(500, req, res);

        iris.log("error", e);

      });

    } else {

      next();

    }
  })
})

iris.modules.user.globals.login = function (auth, res, callback) {

  iris.dbCollections['user'].findOne({
    "username": auth.username
  }, function (err, doc) {

    if (doc) {

      var userid = doc.eid.toString();

      bcrypt.compare(auth.password, doc.password, function (err, match) {

        if (!err && match === true) {

          iris.hook("hook_auth_maketoken", "root", null, {
            userid: userid
          }).then(function (token) {

            iris.modules.sessions.globals.writeCookies(userid, token.id, res, 8.64e7, {});

            callback(userid);

          }, function (fail) {

            console.log(fail);

          });

        } else {

          callback(false);

        }

      });

    } else {

      callback(false);

    }

  });

};

iris.app.get("/logout", function (req, res) {

  res.clearCookie('userid');
  res.clearCookie('token');

  res.clearCookie('admin_auth');

  res.redirect("/");

});

iris.modules.user.registerHook("hook_entity_presave", 1, function (thisHook, entity) {

  if (entity.password && entity.password !== '') {

    bcrypt.hash(entity.password, null, null, function (err, hash) {

      if (err) {

        thisHook.finish(false, "Could not hash password");

      } else {

        entity.password = hash;
        thisHook.finish(true, entity);

      }

    });

  } else {

    // If password is blank or not set, don't bother hashing it

    // When editing a user, this results in a blank password
    // meaning "keep the same password"

    delete entity.password;

    thisHook.finish(true, entity);

  }

});

iris.modules.user.globals.userRoles = {};

iris.modules.user.globals.getRole = function (userid, callback) {

  if (iris.modules.user.globals.userRoles[userid]) {

    callback(iris.modules.user.globals.userRoles[userid]);

  } else {

    iris.dbCollections['user'].findOne({
      eid: parseInt(userid)
    }, function (err, doc) {

      if (!err && doc && doc.roles) {

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

    iris.modules.user.globals.getRole(thisHook.req.cookies.userid, function (roles) {

      data.roles = data.roles.concat(roles);

      thisHook.finish(true, data);

    });

  } else {

    thisHook.finish(true, data);

  }

});

iris.modules.user.registerHook("hook_entity_updated", 1, function (thisHook, entity) {

  if (entity.entityType === 'user' && entity.userid) {

    if (iris.modules.user.globals.userRoles[entity.userid]) {

      delete iris.modules.user.globals.userRoles[entity.userid];

    }

  }

  thisHook.finish(true, entity);

});

require('./login_form.js');

// Login form

iris.app.get("/login", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('authenticated') !== -1) {

    res.send("Already logged in");

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["login"], ['html'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

// Blank password field on entity edit

iris.modules.user.registerHook("hook_form_render_editEntity", 1, function (thisHook, data) {

  if (thisHook.const.params[1] === "user" && data.schema && data.schema.password) {

    data.schema.password.default = null;
    data.schema.password.required = false;
    data.schema.password.title = "Change password";
    data.schema.password.description = "Change your password by typing a new one into the form below";

  }

  thisHook.finish(true, data);

});

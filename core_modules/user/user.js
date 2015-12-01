C.registerModule("user");

var bcrypt = require("bcrypt-nodejs");

// First ever login form

CM.user.registerHook("hook_form_render_set_first_user", 0, function (thisHook, data) {

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

})

CM.user.registerHook("hook_form_submit_set_first_user", 0, function (thisHook, data) {

  var user = {

    entityType: "user",
    entityAuthor: "system",
    password: thisHook.const.params.password,
    username: thisHook.const.params.username,
    roles: ["admin"]
  }

  C.hook("hook_entity_create", "root", user, user).then(function (user) {

    console.log(user);
    thisHook.finish(true, data);

  }, function (fail) {

    console.log(fail);

  })

})

// First ever login page (should only show if no user has been set up)

C.app.get("/firstuser", function (req, res) {

  CM.frontend.globals.parseTemplateFile(["first_user"], null, {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

CM.user.globals.login = function (auth, res, callback) {

  C.dbCollections['user'].findOne({
    "username": auth.username
  }, function (err, doc) {

    if (doc) {

      var userid = doc.eid.toString();

      bcrypt.compare(auth.password, doc.password, function (err, match) {

        if (!err && match === true) {

          C.hook("hook_auth_maketoken", "root", null, {
            userid: userid
          }).then(function (token) {

            CM.sessions.globals.writeCookies(userid, token.id, res, 8.64e7, {});

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

C.app.get("/logout", function (req, res) {

  res.clearCookie('userid');
  res.clearCookie('token');

  res.clearCookie('admin_auth');

  res.redirect("/");

});

CM.user.registerHook("hook_entity_presave", 1, function (thisHook, entity) {

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

CM.user.globals.userRoles = {};

CM.user.globals.getRole = function (userid, callback) {

  if (CM.user.globals.userRoles[userid]) {

    callback(CM.user.globals.userRoles[userid]);

  } else {

    C.dbCollections['user'].findOne({
      eid: parseInt(userid)
    }, function (err, doc) {

      if (!err && doc && doc.roles) {

        CM.user.globals.userRoles[userid] = doc.roles;

        callback(doc.roles);

      } else {

        callback([]);

      }

    });

  }

};

CM.user.registerHook("hook_auth_authpass", 5, function (thisHook, data) {

  if (data.roles && data.roles.indexOf('authenticated') !== -1) {

    CM.user.globals.getRole(thisHook.req.cookies.userid, function (roles) {

      data.roles = data.roles.concat(roles);

      thisHook.finish(true, data);

    });

  } else {

    thisHook.finish(true, data);

  }

});

CM.user.registerHook("hook_entity_updated", 1, function (thisHook, entity) {

  if (entity.entityType === 'user' && entity.userid) {

    if (CM.user.globals.userRoles[entity.userid]) {

      delete CM.user.globals.userRoles[entity.userid];

    }

  }

  thisHook.finish(true, entity);

});

require('./login_form.js');

// Login form

C.app.get("/login", function (req, res) {

  // If not admin, present 403 page
  
  if (req.authPass.roles.indexOf('authenticated') !== -1) {

    res.send("Already logged in");

    return false;

  }

  CM.frontend.globals.parseTemplateFile(["login"], ['html'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    CM.frontend.globals.displayErrorPage(500, req, res);

    C.log("error", e);

  });

})

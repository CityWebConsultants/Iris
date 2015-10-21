C.registerModule("user");

C.registerDbModel("user");

C.registerDbSchema("user", {

  name: {
    type: String,
    title: "Username",
    required: true
  },
  userid: {
    title: "User id",
    type: String,
    required: true
  },
  password: {
    title: "Password",
    type: String,
    required: true
  },
  roles: {
    title: "Roles",
    type: [String],
    required: false
  }

});

var bcrypt = require("bcrypt-nodejs");

C.app.post("/login", function (req, res) {

  if (req.body.username && req.body.password) {

    CM.user.globals.login({
      username: req.body.username,
      password: req.body.password
    }, res, function (userid) {

      if (userid) {

        res.respond(200, userid);

      } else {

        res.respond(400, "Invalid credentials");

      }

    });

  } else {

    res.respond(400, "Must send credentials");

  }

});

CM.user.globals.login = function (auth, res, callback) {

  C.dbCollections['user'].findOne({
    "name": auth.username
  }, function (err, doc) {

    if (doc) {

      bcrypt.compare(auth.password, doc.password, function (err, match) {

        if (!err && match === true) {

          C.hook("hook_auth_maketoken", "root", null, {
            userid: doc.userid
          }).then(function (token) {

            CM.sessions.globals.writeCookies(doc.userid, token.id, res, 8.64e7, {});

            callback(doc.userid);

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

CM.user.registerHook("hook_entity_presave", 1, function (thisHook, entity) {

  bcrypt.hash(entity.password, null, null, function (err, hash) {

    if (err) {

      thisHook.finish(false, "Could not hash password");

    } else {

      entity.password = hash;
      thisHook.finish(true, entity);

    }

  });

});

CM.user.registerHook("hook_entity_view_bulk", 2, function (thisHook, entities) {

  var userids = {};

  var promises = [];

  entities.forEach(function (message) {

    if (message.userid) {

      userids[message.userid] = "";

    }

  });

  Object.keys(userids).forEach(function (key) {

    promises.push(C.promise(function (data, success, fail) {

      C.dbCollections['user'].findOne({
        userid: key
      }, function (err, user) {

        userids[key] = user.name;

        success(data);

      });

    }));

  });

  var success = function (success) {

    success.forEach(function (message, index) {

      success[index].username = userids[message.userid];

    });

    thisHook.finish(true, success);

  };

  var fail = function (fail) {

    thisHook.finish(false, fail);

  };

  C.promiseChain(promises, entities, success, fail);


});

CM.user.globals.userRoles = {};

CM.user.globals.getRole = function (userid, callback) {

  if (CM.user.globals.userRoles[userid]) {

    callback(CM.user.globals.userRoles[userid]);

  } else {

    C.dbCollections['user'].findOne({
        userid: userid
    }, function (err, doc) {

      if (!err && doc.roles) {

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

    CM.user.globals.getRole(thisHook.req.cookies.userid, function(roles) {

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

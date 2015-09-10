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
  }

});

CM.user.registerHook("hook_auth_authpass", 2, function (thisHook, data) {

  if (thisHook.req && thisHook.req.cookies && thisHook.req.cookies.userid && thisHook.req.cookies.token) {

    if (CM.auth.globals.checkAccessToken(thisHook.req.cookies.userid, thisHook.req.cookies.token)) {

      data.userid = thisHook.req.cookies.userid;
      data.roles.push("authenticated");

    }

  }

  thisHook.finish(true, data);

});

C.app.post("/login", function (req, res) {

  if (req.body.username && req.body.password) {

    C.dbCollections['user'].findOne({
      "name": req.body.username,
      "password": req.body.password
    }, function (err, doc) {

      if (doc) {

        C.hook("hook_auth_maketoken", {
          userid: doc.userid
        }, "root").then(function (token) {

          res.cookie('userid', doc.userid);
          res.cookie('token', token.id);

          res.respond(200, doc.userid);

        });

        return false;

      } else {

        res.respond(400, "Invalid credentials");

      }

    });

  } else {

    res.respond(400, "Must send credentials");

  }

});

CM.user.registerHook("hook_entity_view_message", 2, function (thisHook, entities) {
    
  var userids = {};

  var promises = [];

  entities.forEach(function (message) {

    userids[message.userid] = "";

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

C.app.get("/checkauth", function (req, res) {

  res.send(req.authPass);

});

C.app.post("/logout", function (req, res) {

  C.hook("hook_auth_clearauth", req.authPass.userid, "root");

  res.send("logged out");

});

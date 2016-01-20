iris.registerModule("sessions");

iris.app.get("/checkauth", function (req, res) {

  res.respond(200, req.authPass.userid);

});

iris.modules.sessions.registerHook("hook_auth_authpass", 2, function (thisHook, data) {


  if (thisHook.req && thisHook.req.cookies && thisHook.req.cookies.userid && thisHook.req.cookies.token) {

    if (iris.modules.auth.globals.checkAccessToken(thisHook.req.cookies.userid, thisHook.req.cookies.token)) {

      data.userid = thisHook.req.cookies.userid;
      data.roles.push("authenticated");

      // Remove anonymous role

      if (data.roles.indexOf("anonymous") !== -1) {

        data.roles.splice(data.roles.indexOf("anonymous"), 1);

      }

    }

  }

  // Check if anonymous cookie written

  if (data.userid === "anonymous" && thisHook.const.res) {

    if (thisHook.const.req && thisHook.const.req.cookies && !thisHook.const.req.cookies.anonID) {

      var crypto = require("crypto");

      crypto.randomBytes(16, function (ex, buf) {

        var anonID = "anon" + "_" + buf.toString('hex');

        thisHook.const.res.cookie('anonID', anonID);
        
        data.userid = anonID;
        thisHook.finish(true, data);
        
      })


    } else if (thisHook.const.req && thisHook.const.req.cookies && thisHook.const.req.cookies.anonID) {

      data.userid = thisHook.const.req.cookies.anonID;

      thisHook.finish(true, data);

    } else {

      thisHook.finish(true, data);

    }

  } else {

    if (thisHook.const.req && thisHook.const.req.cookies && thisHook.const.req.cookies.anonID) {

      thisHook.const.res.cookie('anonID', "");

    }

    thisHook.finish(true, data);

  }

});

iris.modules.sessions.globals.writeCookies = function (userid, token, res, maxAge, options) {

  var cookieOptions = {};

  if (maxAge) {
    cookieOptions.maxAge = maxAge
  }

  res.cookie('userid', userid, cookieOptions);
  res.cookie('token', token, cookieOptions);

};

iris.modules.user.registerHook("hook_entity_deleted", 1, function (thisHook, entity) {
    console.log(thisHook);
});
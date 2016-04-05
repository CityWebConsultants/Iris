/*jshint nomen: true, node:true, sub:true */
/* globals iris,mongoose,Promise */

iris.registerModule("sessions");

iris.app.get("/checkauth", function (req, res) {

  res.respond(200, req.authPass.userid);

});

iris.modules.sessions.registerHook("hook_auth_authpass", 2, function (thisHook, data) {

  if (thisHook.req && thisHook.req.cookies && thisHook.req.cookies.userid && thisHook.req.cookies.token) {

    if (iris.modules.auth.globals.checkAccessToken(thisHook.req.cookies.userid, thisHook.req.cookies.token)) {

      data.userid = thisHook.req.cookies.userid;
      data.roles.push("authenticated");

      if (thisHook.context.req.cookies.anonID) {

        thisHook.context.res.cookie('anonID', '');
      }

      // Remove anonymous role

      if (data.roles.indexOf("anonymous") !== -1) {

        data.roles.splice(data.roles.indexOf("anonymous"), 1);

      }

    }
    else {
      thisHook.context.res.cookie('userid', '');
      thisHook.context.res.cookie('token', '');
    }

  }

  // Check if anonymous cookie written

  if (data.userid === "anonymous" && thisHook.context.res) {

    if (thisHook.context.req && thisHook.context.req.cookies && !thisHook.context.req.cookies.anonID) {

      var crypto = require("crypto");

      crypto.randomBytes(16, function (ex, buf) {

        var anonID = "anon" + "_" + buf.toString('hex');

        thisHook.context.res.cookie('anonID', anonID);

        data.userid = anonID;
        thisHook.pass(data);

      });

    }
    else if (thisHook.context.req && thisHook.context.req.cookies && thisHook.context.req.cookies.anonID) {

      data.userid = thisHook.context.req.cookies.anonID;

      thisHook.pass(data);

    }
    else {

      thisHook.pass(data);

    }

  }
  else {

    if (thisHook.context.req && thisHook.context.req.cookies && thisHook.context.req.cookies.anonID) {

      thisHook.context.res.cookie('anonID', "");

    }

    thisHook.pass(data);

  }

});

iris.modules.sessions.globals.writeCookies = function (userid, token, res, maxAge, options) {

  var cookieOptions = {};

  if (maxAge) {
    cookieOptions.maxAge = maxAge;
  }

  res.cookie('userid', userid, cookieOptions);
  res.cookie('token', token, cookieOptions);

};

iris.modules.sessions.registerHook("hook_entity_deleted", 1, function (thisHook, entity) {

  delete iris.modules.auth.globals.userList[entity.eid];

});
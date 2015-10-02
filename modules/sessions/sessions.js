C.registerModule("sessions");

C.app.get("/checkauth", function (req, res) {

  res.respond(200, req.authPass.userid);

});

CM.sessions.registerHook("hook_auth_authpass", 2, function (thisHook, data) {

  if (thisHook.req && thisHook.req.cookies && thisHook.req.cookies.userid && thisHook.req.cookies.token) {

    if (CM.auth.globals.checkAccessToken(thisHook.req.cookies.userid, thisHook.req.cookies.token)) {

      data.userid = thisHook.req.cookies.userid;
      data.roles.push("authenticated");

    }

  }

  thisHook.finish(true, data);

});

CM.sessions.globals.writeCookies = function (userid, token, res, maxAge, options) {

  var cookieOptions = {};

  if (maxAge) {
    cookieOptions.maxAge = maxAge
  }

  res.cookie('userid', userid, cookieOptions);
  res.cookie('token', token, cookieOptions);

};

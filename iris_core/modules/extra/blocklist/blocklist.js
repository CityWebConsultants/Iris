iris.modules.blocklist.globals = {

  "blockedIPs": []

}

iris.modules.blocklist.registerHook("hook_request_intercept", 0, function (thisHook, data) {

  var req = thisHook.context.req;

  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (iris.modules.blocklist.globals.blockedIPs.indexOf(ip) !== -1) {

    iris.log("info", "Blocked IP " + ip + " tried to access url " + thisHook.context.req.url);

    thisHook.fail("Blocked");

  } else {

    thisHook.pass(data);

  }


});

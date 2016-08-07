iris.modules.ip_access.globals = {};

iris.modules.ip_access.globals.blockedIPs = [];

iris.modules.ip_access.registerHook("hook_form_render__ip_access", 0, function (thisHook, data) {

  var config,
      current;

  try {
    config = iris.readConfigSync("ip_access", "ip_access");
  } catch (e) {

    config = undefined;

  }

  if (config) {

    current = config.list;

  }

  data.schema = {
    "list": {
      "default": current,
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "path": {
            "type": "textarea",
            "title": "Path pattern"
          },
          "method": {
            "title": "Block or limit to IP address",
            "type": "text",
            "enum": ["block", "allow"]
          },
          "ips": {
            title: "IPs",
            type: "array",
            items: {
              type: "string"
            }
          }

        }

      }
    }

  };

  thisHook.pass(data);

});

iris.modules.ip_access.registerHook("hook_form_submit__ip_access", 0, function (thisHook, data) {

  iris.saveConfigSync(thisHook.context.params, "ip_access", "ip_access");

  thisHook.pass(data);

});


var minimatch = require("minimatch");

iris.modules.ip_access.registerHook("hook_request_intercept", 0, function (thisHook, data) {

  var ipSettings;

  try {
    ipSettings = iris.readConfigSync("ip_access", "ip_access");
  } catch (e) {

    ipSettings = undefined;

  }

  if (!ipSettings) {

    thisHook.pass(data);

  }

  var block = false;

  var req = thisHook.context.req;

  var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  ipSettings.list.forEach(function (listItem) {

    var valid = true;

    var paths = listItem.path.replace(/\r\n/g, '\n').split("\n");

    var currentUrl = req.url;

    // Loop over paths
  
    paths.forEach(function (path) {

      valid = minimatch(currentUrl, path);

    });

    if (valid) {

      if (!listItem.ips) {

        listItem.ips = [];

      }

      // Check if IP is in IP list

      if (listItem.ips.indexOf(ip) !== -1 && listItem.method === "block") {

        block = true;

      }

      if (listItem.ips.indexOf(ip) !== -1 && listItem.method === "allow") {

        block = true;

      }

    }

  });

  if (block) {

    thisHook.fail("");

    iris.log("error", "ip " + ip + " blocked from accessing + " + req.url);

  } else {

    thisHook.pass(data);

  }

});

iris.route.get("/admin/structure/ip_access", {
  title: "IP access",
  description: "IP access",
  permissions: ["can access admin pages"],
  menu: [{
    menuName: "admin_toolbar",
    parent: "/admin/config",
    title: "IP Access"
    }]
}, function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.menu_ui.globals.getMenuList().then(function (menuList) {

    iris.modules.frontend.globals.parseTemplateFile(["admin_ip_access"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

      res.send(success);

    }, function (fail) {

      iris.modules.frontend.globals.displayErrorPage(500, req, res);

      iris.log("error", e);

    });

  });

});

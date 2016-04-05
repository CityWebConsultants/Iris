/*jshint nomen: true, node:true, sub:true */
/* globals iris,mongoose,Promise */

/**
 * @file Manages routing for the admin configuration pages.
 */
var fs = require('fs');

/**
 * Define callback routes.
 */
var routes = {
  admin : {
    title: "Admin",
    description: "Auto-generate tokenised url paths for entities.",
    permissions: ["can access admin pages"],
  },
  logs : {
    title: "Logs",
    description: "A list of all log messages",
    permissions: ["can access admin pages"],
    "menu": [{
      menuName: "admin_toolbar",
      parent: null,
      title: "Logs"
    }]
  },
  structure : {
    title: "Structure",
    description: "Information architecture components",
    permissions: ["can access admin pages"],
    "menu": [{
      menuName: "admin_toolbar",
      parent: null,
      title: "Structure"
    }]
  },
  restart: {
    title: "Restart system",
    description: "Restart to reload configurations and code changes",
    permissions: ["can access admin pages"],
    "menu": [{
      menuName: "admin_toolbar",
      parent: null,
      title: "Restart"
    }]
  }
};

/**
 * Admin page callback: Root admin page.
 */
iris.route.get("/admin", routes.admin, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["admin_dashboard"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success);

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

/**
 * Admin page callback: System logs.
 */
iris.route.get("/admin/logs", routes.logs, function (req, res) {

  try {

    var rawLogs = fs.readFileSync(iris.sitePath + '/' + "/logs/main.log", "utf8");

  } catch (e) {

    fs.writeFileSync("", iris.sitePath + '/' + "/logs/main.log");

    var rawLogs = "";

  }

  //Remove last line

  rawLogs = rawLogs.replace(/\n$/, "");

  //Split logs by newline

  var logs = rawLogs.split(/\r?\n/);

  logs.forEach(function (element, index) {

    logs[index] = JSON.parse(logs[index]);

    Object.keys(logs[index]).forEach(function (element) {

      if (logs[index][element]) {
        
        logs[index][element] = logs[index][element].toString();

        logs[index][element] = iris.sanitizeEmbeds(logs[index][element]);

        logs[index][element] = logs[index][element].split("{").join("<");
        logs[index][element] = logs[index][element].split("}").join(">");

      }

    });

  });

  if (logs[0]) {

    keys = Object.keys(logs[0]);

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_logs"], ['admin_wrapper'], {
    logs: logs.reverse(),
    keys: keys
  }, req.authPass, req).then(function (success) {

    res.send(success);

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

/**
 * Admin page callback: Structure items.
 */
iris.route.get("/admin/structure", routes.structure, function (req, res) {

  var menu = iris.modules.menu.globals.getBaseLinks(req.url);
  menu.name = req.irisRoute.options.title;

  iris.modules.frontend.globals.parseTemplateFile(["baselinks"], ['admin_wrapper'], {
    menu: menu,
  }, req.authPass, req).then(function (success) {

    res.send(success);

  });

});

/**
 * Admin page callback: Restart server.
 */
iris.route.get("/admin/restart", routes.restart, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["admin_restart"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success);

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

});

/**
 * @function displayErrorPage
 * @memberof frontend
 *
 * @desc Respond to a request with an error page.
 *
 * Wrapper for hook_display_error_page; returns error page HTML on response automatically.
 *
 * @param {number} code - The HTTP error code to return the page for
 * @param {object} req - The current Express request object
 * @param {object} res - The current Express response object
 */
iris.modules.frontend.globals.displayErrorPage = function (code, req, res) {

  iris.invokeHook("hook_display_error_page", req.authPass, {
    error: code,
    req: req,
    res: res
  }).then(function (success) {

    res.status(code).send(success);

  }, function (fail) {

    res.status(code).send(code.toString());

  });

};

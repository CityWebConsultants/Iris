/**
 * @file Manages routing for the admin configuration pages.
 */
var fs = require('fs');

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

  iris.hook("hook_display_error_page", req.authPass, {
    error: code,
    req: req,
    res: res
  }).then(function (success) {

    res.status(code).send(success);

  }, function (fail) {

    res.status(code).send(code.toString());

  });

};



iris.app.get("/admin", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_dashboard"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

})


iris.route.get("/admin/logs", {
  "menu": [{
    menuName: "admin_toolbar",
    parent: null,
    title: "Logs"
  }]
}, function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

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

    //console.log('0', logs[index]);
    logs[index] = iris.sanitizeEmbeds(logs[index]);

    //console.log('1', logs[index]);
    logs[index] = JSON.parse(logs[index]);
    //console.log('2', logs[index]);

  });

  if (logs[0]) {

    keys = Object.keys(logs[0]);

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_logs"], ['admin_wrapper'], {
    logs: logs.reverse(),
    keys: keys
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

})


// Structure page

iris.route.get("/admin/structure", {
  "menu": [{
    menuName: "admin_toolbar",
    parent: null,
    title: "Structure"
  }]
}, function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  // Load in admin menu

  var structureMenu = {};

  if (iris.configStore["menu"]["admin-toolbar"]) {

    iris.configStore["menu"]["admin-toolbar"].items.forEach(function (item) {

      if (item.path === "/admin/structure") {

        structureMenu = item;

      }

    })

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_structure"], ['admin_wrapper'], {
    structureMenu: structureMenu
  }, req.authPass, req).then(function (success) {
    res.send(success)
  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

})


// Restart page

iris.route.get("/admin/restart", {
  "menu": [{
    menuName: "admin_toolbar",
    parent: null,
    title: "Restart"
  }]
}, function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_restart"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", fail);

  });

})

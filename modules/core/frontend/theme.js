/*jshint nomen: true, node:true, sub:true */
/* globals iris,mongoose,Promise */

var path = require("path");
var fs = require("fs");
var express = require("express");

/**
 * @function setActiveTheme
 * @memberof frontend
 *
 * @desc Sets the active name from the passed values.
 *
 * @param {string} themePath - path to the theme folder
 * @param {string} themeName - name of the active theme
 *
 * @returns error message if it fails.
 */
iris.modules.frontend.globals.setActiveTheme = function (themeName) {

  var glob = require("glob");

  // Reset theme lookup registry

  iris.modules.frontend.globals.templateRegistry.theme = [];

  var result = {};

  try {

    var unmet = [];
    var loadedDeps = [];

    // Find theme

    var found = glob.sync("{" + iris.rootPath + "/themes/*/" + themeName + ".iris.theme" + "," + iris.sitePath + "/themes/*/" + themeName + ".iris.theme" + "," + iris.rootPath + "/home/themes/*/" + themeName + ".iris.theme" + "}");

    var path = require("path");


    if (found.length) {

      var themeInfo = JSON.parse(fs.readFileSync(found[0]), "utf8");

      var theme = {
        name: themeName,
        path: path.dirname(found[0]),
        info: themeInfo
      };

    } else {

      iris.log("error", "Could not find theme " + themeName);
      return false;

    }

    // Read modules this theme is dependent on

    if (theme.info.dependencies) {

      Object.keys(theme.info.dependencies).forEach(function (dep) {

        if (!iris.modules[dep]) {

          unmet.push(dep);

        }

      });

    }

    // Push in theme templates to template lookup registry

    if (!unmet.length) {

      // Make config into a variable accessible by other modules

      iris.modules.frontend.globals.activeTheme = theme;

      iris.modules.frontend.globals.templateRegistry.theme.push(theme.path + "/templates");

      // Push in theme's static folder

      iris.app.use("/themes/" + themeName, express.static(theme.path + "/static"));

    } else {

      result.errors = "Active theme has unmet dependencies: " + unmet.join(",");

    }

  } catch (e) {

    iris.log("error", e);

    result.errors = "Something went wrong.";

  }

  return result;

};

try {


  var themeFile = fs.readFileSync(iris.configPath + "/system/active_theme.json", "utf8");

  try {

    var activeTheme = JSON.parse(themeFile);

    var setTheme = iris.modules.frontend.globals.setActiveTheme(activeTheme.name);

    if (setTheme.errors) {

      iris.log("error", "Could not enable " + activeTheme.name);
      iris.log("error", setTheme.errors);

    }

  } catch (e) {

    iris.log("error", e);

  }

} catch (e) {

  iris.log("info", "No theme enabled");

}

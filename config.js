/*jshint nomen: true, node:true */
/* globals iris,mongoose,Promise */

/**
 * @file Provides configuration storage
 */

iris.mkdirSync(iris.sitePath + "/" + "configurations");

iris.mkdirSync(iris.sitePath + "/" + "configurations/system");

var path = require("path");
var fs = require("fs");

iris.configStore = {};

iris.configPath = path.join(iris.sitePath, "/configurations");

/**
 * Syncronously saves a JavaScript object as a JSON configuration file.
 *
 * Additionally, adds the config to the configStore in memory.
 *
 * @param {object} contents - The object (of key-value pairs) to be saved
 * @param {string} directory - The directory, under "<site path>/configurations", in which to store the file
 * @param {string} filename - The name of the file
 *
 * @returns {boolean} 'err' boolean (false if operation successful)
 */
iris.saveConfigSync = function (contents, directory, filename, writeToFile) {

  var current = iris.configStore;

  directory.split("/").forEach(function (path) {

    if (!current[path]) {

      current[path] = {};

    }

    current = current[path];

  });

  current[filename] = contents;

  if (writeToFile !== false) {

    var filePath = path.join(iris.sitePath, "/configurations", directory);

    var mkdirp = require('mkdirp');

    try {
      mkdirp.sync(filePath);
      
      //  Fire config saved hook

      iris.invokeHook("hook_config_saved", "root", {
        contents: contents,
        directory: directory,
        filename: filename
      });

      return fs.writeFileSync(filePath + "/" + filename + ".json", JSON.stringify(contents), "utf8") || false;
    } catch (e) {

      iris.log("error", e);
      return true;

    }
  }



};


/**
 * Saves a JavaScript object as a JSON configuration file.
 *
 * Additionally, adds the config to the configStore in memory.
 *
 * @param {object} contents - The object (of key-value pairs) to be saved
 * @param {string} directory - The directory, under "<site path>/configurations", in which to store the file
 * @param {string} filename - The name of the file
 * @param {function} callback - The callback to run once the file has been saved
 *
 * @returns Runs callback with 'err' boolean (false if operation successful)
 */
iris.saveConfig = function (contents, directory, filename, callback, writeToFile) {

  var current = iris.configStore;

  directory.split("/").forEach(function (path) {

    if (!current[path]) {

      current[path] = {};

    }

    current = current[path];

  });

  current[filename] = contents;

  if (writeToFile !== false) {

    var filePath = path.join(iris.sitePath, "/configurations", directory);

    var mkdirp = require('mkdirp');

    mkdirp(filePath, function (err) {
      if (err) {
        iris.log("error", err);
      } else {
        fs.writeFile(filePath + "/" + filename + ".json", JSON.stringify(contents), "utf8", callback);
      }
    });
  }

  // Fire config saved hook

  iris.invokeHook("hook_config_saved", "root", {
    contents: contents,
    directory: directory,
    filename: filename
  });

};

/**
 * Deletes a saved JSON config file
 *
 * Additionally, the saved configStore for the file will be deleted
 *
 * @param {string} directory - The directory, under "<site path>/configurations", in which the file is stored
 * @param {string} filename - The name of the file
 * @param {string} callback - The callback to run once completed
 *
 * @returns Runs callback with 'err' boolean (false if operation successful)
 */
iris.deleteConfig = function (directory, filename, callback) {

  var splitDirectory = directory.split('/');

  if (splitDirectory.length > 1) {

    // Get last parts of the directory, used as key in config store
    var configStoreCategory = splitDirectory[splitDirectory.length - 2];
    var configStoreInstance = splitDirectory[splitDirectory.length - 1];

    delete iris.configStore[configStoreCategory][configStoreInstance][filename];

  } else {

    if (iris.configStore[directory]) {
      delete iris.configStore[directory][filename];
    }

  }

  var filePath = path.join(iris.sitePath, "/configurations", directory);

  filePath = filePath + '/' + filename + '.json';

  fs.unlink(filePath, function (err) {

    if (err) {

      // Return err = true
      callback(true);

    } else {

      callback(false);

    }

  });

};

/**
 * Syncronously Reads a stored JSON configuration file
 *
 * Will attempt to read from the configStore cache.
 *
 * @param {string} directory - The directory, under "<site path>/configurations", in which the file is stored
 * @param {string} filename - The name of the file
 *
 * @returns file content object if successful and boolean false otherwise with error log in iris log
 */

iris.readConfigSync = function (directory, filename) {

  function defined(ref, strNames) {
    var name;
    var arrNames = strNames.split('/');

    while (typeof (name = arrNames.shift()) === "string") {
      if (!ref.hasOwnProperty(name)) {
        return false;
      }
      ref = ref[name];
    }

    return ref;
  }
  var exists = defined(iris.configStore, directory + "/" + filename);

  if (exists) {

    return exists;

  } else {
    try {

      var contents = JSON.parse(fs.readFileSync(iris.sitePath + "/configurations" + "/" + directory + "/" + filename + ".json", "utf8"));

      if (!iris.saveConfigSync(contents, directory, filename, false)) {
        return contents;
      }
      else {
        return false;
      }


    } catch (e) {
      iris.log("error", e);
      return false;
    }
  }
};

/**
 * Reads a stored JSON configuration file
 *
 * Will attempt to read from the configStore cache.
 *
 * @param {string} directory - The directory, under "<site path>/configurations", in which the file is stored
 * @param {string} filename - The name of the file
 *
 * @returns A promise which, if successful, has the config file as a JavaScript object as its first argument
 */

iris.readConfig = function (directory, filename) {

  return new Promise(function (yes, no) {

    function defined(ref, strNames) {
      var name;
      var arrNames = strNames.split('/');
            
      while (typeof (name = arrNames.shift()) === "string") {
        if (!ref.hasOwnProperty(name)) {
          return false;
        }
        ref = ref[name];
      }

      return ref;
    }

    var exists = defined(iris.configStore, directory + "/" + filename);

    if (exists) {

      yes(exists);

    } else {

      try {

        var contents = JSON.parse(fs.readFileSync(iris.sitePath + "/configurations" + "/" + directory + "/" + filename + ".json", "utf8"));

        iris.saveConfig(contents, directory, filename, null, false);

        yes(contents);

      } catch (e) {

        no(e);

      }

    }

  });

};

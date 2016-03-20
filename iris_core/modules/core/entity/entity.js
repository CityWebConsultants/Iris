/*jshint nomen: true, node:true */
/* globals iris,mongoose,Promise*/

"use strict";

var fs = require('fs');

var mkdirSync = function (path) {
  try {
    fs.mkdirSync(path);
  } catch (e) {
    if (e.code != 'EEXIST') throw e;
  }
};

mkdirSync(iris.configPath + "/" + "entity");

/**
 * @file Includes for the entity module
 */

/**
 * @namespace entity
 */

iris.registerModule("entity");

require('./entity_create');

require('./entity_delete');

require('./entity_edit');

require('./entity_fetch');

// API hooks for getting schema information

// Get list of entity types

iris.app.get("/api/entitySchema", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    res.status(403);
    res.send("Access denied");

    return false;

  }

  var output = {};

  Object.keys(iris.dbCollections).forEach(function (entityType) {

    output[entityType] = iris.dbCollections[entityType].schema.tree;

  });

  res.send(output);

});

iris.app.get("/api/entitySchema/:type", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    res.status(403);
    res.send("Access denied");

    return false;

  }

  res.send(iris.dbCollections[req.params.type].schema.tree);

});

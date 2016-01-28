/*jslint node: true nomen: true*/

"use strict";

/**
 * @file Includes for the entity module
 */

/**
 * @namespace entity
 */

iris.registerModule("entity", true);

require('./entity_create');

require('./entity_delete');

require('./entity_edit');

require('./entity_fetch');

// API hooks for getting schema information

// Get list of entity types

iris.app.get("/api/entitySchema", function(req, res){
  
  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    res.status(403);
    res.send("Access denied");

    return false;

  }
  
  var output = {};
  
  Object.keys(iris.dbCollections).forEach(function(entityType){
    
    output[entityType] = iris.dbCollections[entityType].schema.tree;
    
  })
  
  res.send(output);
  
})

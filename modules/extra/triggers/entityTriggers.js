// Triggers for entity system

var fieldsToArgs = function (fields) {

  var output = {};

  Object.keys(fields).forEach(function (fieldName) {

    if (typeof fields[fieldName] == "object" && !Array.isArray(fields[fieldName])) {

      Object.keys(fields[fieldName]).forEach(function (subfield) {

        output[fieldName + "." + subfield] = fields[fieldName][subfield];

      })

    } else {

      output[fieldName] = fields[fieldName];

    }

  })

  return output;

}

iris.modules.triggers.registerHook("hook_entity_created", 0, function (thisHook, data) {

  iris.modules.triggers.globals.triggerEvent(data.entityType + "_created", thisHook.authPass, fieldsToArgs(data));

  thisHook.pass(data);

});

iris.modules.triggers.registerHook("hook_entity_deleted", 0, function (thisHook, data) {

  iris.modules.triggers.globals.triggerEvent(data.entityType + "_deleted", thisHook.authPass, data);

  thisHook.pass(data);

});

iris.modules.triggers.registerHook("hook_entity_updated", 0, function (thisHook, data) {

  var newFields = fieldsToArgs(thisHook.context.new);
  var oldFields = fieldsToArgs(thisHook.context.previous);

  var fields = {};


  Object.keys(newFields).forEach(function (fieldName) {

    fields["new." + fieldName] = newFields[fieldName];

  })

  Object.keys(oldFields).forEach(function (fieldName) {

    fields["old." + fieldName] = oldFields[fieldName];

  })

  fields.eid = thisHook.context.new.eid;

  iris.modules.triggers.globals.triggerEvent(data.entityType + "_updated", thisHook.authPass, fields);

  thisHook.pass(data);

})

process.on("dbReady", function () {

  Object.keys(iris.entityTypes).forEach(function (entityType) {

    var fields = [];

    if (iris.entityTypes[entityType].fields) {

      Object.keys(iris.entityTypes[entityType].fields).forEach(function (fieldName) {

        var field = iris.entityTypes[entityType].fields[fieldName];

        var fieldType = iris.fieldTypes[field.fieldType];

        if (typeof fieldType.type === "string") {

          fields.push(fieldName)

        } else {

          // Object field, push in paramaters for every subfield

          Object.keys(fieldType.type).forEach(function (subfield) {

            fields.push(fieldName + "." + subfield);

          })

        }

      })

    }

    iris.modules.triggers.globals.registerEvent(entityType + "_created", fields.concat(["eid"]));

    var editArgs = [];

    fields.forEach(function (fieldName) {

      editArgs.push("old." + fieldName);
      editArgs.push("new." + fieldName);

    })

    iris.modules.triggers.globals.registerEvent(entityType + "_updated", editArgs.concat(["eid"]));

    iris.modules.triggers.globals.registerEvent(entityType + "_deleted", ["eid"]);

  })

})

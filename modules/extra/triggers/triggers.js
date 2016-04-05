iris.modules.triggers.globals.actions = {};
iris.modules.triggers.globals.events = {};

// Load in all actions on start

var fs = require('fs');
var glob = require("glob");

/**
 * Define callback routes.
 */
var routes = {
  create: {
    title: "Create trigger",
    description: "Create system trigger routine.",
    permissions: ["can access admin pages"],
    menu: [{
      menuName: "admin_toolbar",
      parent: '/admin/config/triggers',
      title: "Create trigger"
    }]
  },
  edit: {
    title: "Edit action",
    description: "Edit custom action",
    permissions: ["can access admin pages"],
    menu: [{
      menuName: "admin_toolbar",
      parent: '/admin/config/triggers',
      title: "Edit action"
    }]
  },
  delete: {
    title: "Delete trigger",
    description: "Delete trigger",
    permissions: ["can access admin pages"],
    menu: [{
      menuName: "admin_toolbar",
      parent: '/admin/config/triggers',
      title: "Delete trigger"
    }]
  },
  triggers: {
    title: "Triggers",
    description: "Manage system triggers and actions",
    permissions: ["can access admin pages"],
    menu: [{
      menuName: "admin_toolbar",
      parent: '/admin/config',
      title: "Triggers"
    }]
  }
};

/**
 * Admin page callback: Create trigger.
 */
iris.route.get("/admin/config/triggers/create", routes.create, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["admin_triggers_form"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

/**
 * Admin page callback: Edit action.
 * Register actions create form
 */
iris.route.get("/admin/config/triggers/edit/:action", routes.edit, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["admin_triggers_form"], ['admin_wrapper'], {
    action: iris.sanitizeName(req.params.action)
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

/**
 * Admin page callback: Triggers UI.
 * Manage system triggers and actions.
 */
iris.route.get("/admin/config/triggers", routes.triggers, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["admin_triggers"], ['admin_wrapper'], {
    actions: iris.configStore.triggers,
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

/**
 * Admin page callback: Delete trigger.
 */
iris.route.get("/admin/config/triggers/delete/:name", routes.delete, function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["admin_triggers_delete"], ['admin_wrapper'], {
    action: req.params.name
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});


glob(iris.configPath + "/triggers/*.json", function (er, files) {

  files.forEach(function (file) {

    var config = fs.readFileSync(file, "utf8");

    config = JSON.parse(config);

    if (config.name) {

      iris.saveConfig(config, "triggers", iris.sanitizeName(config.name), function () {

        },
        function (fail) {

          console.log(fail);

        });
    }
  })

})

/**
 * Function to register a new action
 *
 * @param {string} name - The name of the action
 * @param parametersArray - Array of parameters to add to the action
 */
iris.modules.triggers.globals.registerAction = function (name, parametersArray) {

  if (!parametersArray) {

    parametersArray = [];

  }

  iris.modules.triggers.globals.actions[name] = {

    parameters: parametersArray

  }

}

/**
 * Function to register a new event
 *
 * @param {string} name - The name of the event
 * @param parametersArray - Array of parameters to add to the action
 */
iris.modules.triggers.globals.registerEvent = function (name, parametersArray) {

  if (!parametersArray) {

    parametersArray = [];

  }

  if (!Array.isArray(parametersArray)) {

    iris.log("error", name + " actions parameters must be an array of strings");
    return false;

  }

  iris.modules.triggers.globals.events[name] = {

    parameters: parametersArray

  }

}

/**
 * Function to trigger a given event
 *
 * @param {string} name - The name of the event to trigger
 * @param {object} authPass - The authPass of the current user
 * @param {object} [params] - The parameters to pass to the event
 */
iris.modules.triggers.globals.triggerEvent = function (name, authPass, params) {

  if (typeof params !== "object") {

    var params = {};

  }

  iris.invokeHook("hook_triggers_event", authPass, {
    params: params,
    event: name,
  }).then(function (params) {

      // Check if any rules have been registered that grab this stuff

      if (!iris.configStore.triggers) {

        return false;

      }

      Object.keys(iris.configStore.triggers).forEach(function (rule) {

        // Flag for whether rule fires or not

        var fires = true;

        if (iris.configStore.triggers[rule].events.event === name) {

          var rule = JSON.parse(JSON.stringify(iris.configStore.triggers[rule]));

          // Check if any conditions

          if (rule.events.conditions) {

            rule.events.conditions.forEach(function (condition) {

              // Slot in values if present

              Object.keys(params).forEach(function (parameter) {

                if (condition.value.indexOf("[" + parameter + "]") !== -1) {

                  condition.value = params[parameter];

                }

                if (condition.thing.indexOf(parameter) !== -1) {

                  condition.thing = params[parameter];

                }

              })

              //Process query based on operator

              switch (condition.operator) {

                case "is":

                  if (condition.thing.toString() !== condition.value.toString()) {

                    fires = false;

                  }
                  break;

                case "contains":

                  if (condition.thing.toLowerCase().indexOf(condition.value.toString().toLowerCase()) === -1) {

                    fires = false;

                  }
                  break;
              }

            });

          }

          if (fires) {

            // Loop over all the actions and fire them!

            if (rule.actions) {

              rule.actions.forEach(function (currentAction, index) {

                var actionName = currentAction.action;

                // Swap out any tokens in the properties

                Object.keys(currentAction.parameters).forEach(function (parameterName) {

                  var parameter = currentAction.parameters[parameterName];

                  // Slot in values if present

                  Object.keys(params).forEach(function (variable) {

                    if (parameter.indexOf("[" + variable + "]") !== -1) {

                      parameter = parameter.split("[" + variable + "]").join(params[variable]);

                      rule.actions[index].parameters[parameterName] = parameter

                    }

                  })

                })

                iris.invokeHook("hook_triggers_" + actionName, authPass, {
                  params: rule.actions[index].parameters
                }).then(function (success) {

                  iris.log("info", actionName + " fired successfully.");

                  if (success) {

                    iris.log("info", actionName + " returned message " + JSON.stringify(success));

                  }

                }, function (fail) {

                  iris.log("error", actionName + " " + fail);

                })

              })

            }

          }

        }


      })

    },
    function (fail) {

      iris.log("error", fail + " " + name);

    });

};

iris.modules.triggers.registerHook("hook_form_render__actions", 0, function (thisHook, data) {

  var ap = thisHook.authPass;

  if (!data.schema) {
    data.schema = {}
  }

  data.schema.name = {
    "title": ap.t("Name of action")
  }

  data.schema.event = {
    "title": ap.t("Event")
  }

  // Generate form presentation

  data.form = [];

  //  Add name field

  data.form.push({
    key: "name"
  })

  //  Add in helpers
  //  for parameters available from event

  var events = {};

  Object.keys(iris.modules.triggers.globals.events).forEach(function (eventType) {

    var tokens = [];

    iris.modules.triggers.globals.events[eventType].parameters.forEach(function (token) {

      tokens.push("<small><b>[" + token + "]</b></small>");

    })

    events[eventType] = {
      "type": "object",
      "title": ap.t("This event provides the tokens {{token}} which can be used as placeholders in the actions and conditions section of this form", {tokens: tokens.join(",")}),
      "properties": {
        "conditions": {
          "title": ap.t("Conditions"),
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "thing": {
                "type": "text",
                "title": ap.t("property"),
                "enum": ["Pick a parameter"].concat(iris.modules.triggers.globals.events[eventType].parameters)
              },
              "operator": {
                "type": "text",
                "title": ap.t("operator"),
                "enum": ["is", "contains"]
              },
              "value": {
                "type": "text",
                "title": ap.t("value")
              }
            }
          }
        }
      }
    }
  })

  data.schema.events = {
    "type": "object"
  }

  data.schema.events.properties = {};

  data.schema.events.properties.event = {
    "type": "choose",
    "required": true,
    "options": Object.keys(events),
    "title": ap.t("Choose an event type")
  }

  Object.keys(events).forEach(function (event) {

    data.schema.events.properties[event] = events[event];

  })

  data.form.push({
    key: "events"
  })

  // Get list of actions and their fields

  var actions = {};

  Object.keys(iris.modules.triggers.globals.actions).forEach(function (actionType) {

    var tokens = [];

    actions[actionType] = {
      "type": "object",
      "properties": iris.modules.triggers.globals.actions[actionType].parameters
    }

  })

  data.schema.actions = {
    "type": "array"
  }

  data.schema.actions.items = {
    "type": "object",
    "properties": {
      "action": {
        "type": "choose",
        "options": Object.keys(actions),
        "title": ap.t("Choose an action type")
      }
    }
  }

  Object.keys(actions).forEach(function (action) {

    data.schema.actions.items.properties[action] = actions[action];

  })

  data.form.push({
    key: "actions"
  })

  // Add submit button

  data.form.push({
    type: "submit",
    title: ap.t("Save action")
  });

  // Check if already submitted form exists

  if (thisHook.context.params[1] && thisHook.context.params[1].indexOf("{{") !== -1) {

    thisHook.fail();
    return false;

  }

  if (thisHook.context.params[1] && iris.configStore.triggers[thisHook.context.params[1]]) {

    data.value = iris.configStore.triggers[thisHook.context.params[1]];

    // Swap values back into format schema understands. This is madness.

    data.value.events[data.value.events.event] = {
      conditions: data.value.events.conditions
    };

    data.value.actions.forEach(function (action, index) {

      data.value.actions[index] = {

        action: action.action

      }

      data.value.actions[index][action.action] = action.parameters;

    });
  }

  thisHook.pass(data);

})

// Register action save hook

iris.modules.triggers.registerHook("hook_form_submit__actions", 0, function (thisHook, data) {

  // Juggle around schema for saving to make it more human readable

  Object.keys(thisHook.context.params).forEach(function (fieldName) {

    var field = thisHook.context.params[fieldName];

    if (field.event) {

      field.conditions = field[field.event].conditions;

      delete field[field.event];

    }

    if (fieldName === "actions") {

      field.forEach(function (subField) {

        subField.parameters = subField[subField.action];

        delete subField[subField.action];

      })

    }

  })

  iris.saveConfig(thisHook.context.params, "triggers", iris.sanitizeName(thisHook.context.params.name), function (saved) {

    var data = function (res) {

      res.send("/admin/triggers");

    };

    thisHook.pass(data);

  })

});

iris.modules.triggers.registerHook("hook_form_render__action_delete", 0, function (thisHook, data) {

  if (!data.schema) {

    data.schema = {};

  }

  data.schema["action"] = {
    type: "hidden",
    default: thisHook.context.params[1]
  };

  thisHook.pass(data);

});

iris.modules.triggers.registerHook("hook_form_submit__action_delete", 0, function (thisHook, data) {

  var action = iris.sanitizeName(thisHook.context.params.action);

  if (iris.configStore.triggers && iris.configStore.triggers[action]) {

  } else {

    return false;

  }

  iris.deleteConfig("actions", action, function (err) {

    if (err) {

      thisHook.fail(data);

    }

    var data = function (res) {

      res.send("/admin/triggers");

    };

    thisHook.pass(data);

  });

});

iris.modules.forms.globals.registerWidget(function () {

  JSONForm.elementTypes['choose'] = Object.create(JSONForm.elementTypes['text']);
  JSONForm.elementTypes['choose'].template = '<% node.optionsSelect = "<option>Choose</option>";node.schemaElement.options.forEach(function (item) {node.optionsSelect += "<option value="+item+">" + item + "</option>"}) %><select value="<%= escape(value) %>" name="<%= node.name %>" onchange="chooseField(event)" class="field-collection-select form-control"><%= node.optionsSelect %></select>';

  JSONForm.elementTypes['choose'].onInsert = function (e, node) {

    var parent = $("select[name='" + node.name + "']").closest("fieldset");

    if (node.value) {

      var choice = node.value;

      $("select[name='" + node.name + "']").val(choice);

      var fields = $(parent).find(".jsonform-node");

      $.each(fields, function (index, element) {

        if (index !== 0) {

          var field = $(element).attr("class").split("---")[1];

          if (field.indexOf(choice) === -1) {

            // Disable all fields other than the selected one

            $(element).hide().find("*[name]").attr("disabled", "true");

          } else {

            $(element).show().find("*[name]").removeAttr("disabled");

          }

        }

      })

    } else {

      var parent = $("select[name='" + node.name + "']").closest("fieldset");

      var fields = $(parent).find(".jsonform-node");
      var start = 0;

      if (fields.length === 2) {

        $(parent).css("color", "red");
        fields = $(parent).find(".jsonform-node");
        start = 1;

      }

      $.each(fields, function (index, element) {

        if (index > start) {

          // Disable all fields after choose field

          $(element).hide().find("*[name]").attr("disabled", "true");

        }

      })

    }

  };

  window.chooseField = function (e) {

    var choice = e.target.value;

    var parent = $(e.target).closest("fieldset");
    var fields = $(parent).find(".jsonform-node");

    var start = 0;

    if (fields.length === 2) {



    }

    $.each(fields, function (index, element) {

      if (index > start) {

        var field = $(element).attr("class").split("---")[1];

        if (field.indexOf(choice) === -1) {

          // Disable all fields other than the selected one

          $(element).hide().find("*[name]").attr("disabled", "true");

        } else {

          $(element).show().find("*[name]").removeAttr("disabled");

        }

      }

    })

  };

}, "choose");

// Default hook

iris.modules.triggers.registerHook("hook_triggers_event", 0, function (thisHook, data) {

  data = thisHook.context.params;

  thisHook.pass(data);

})

// Some default events and actions for logging messages on page view

iris.modules.triggers.globals.registerEvent("page_visit", ["url", "userid", "roles"]);

iris.modules.triggers.registerHook("hook_request_intercept", 0, function (thisHook, data) {

  var params = {
    "url": thisHook.context.req.url,
    "userid": thisHook.authPass.userid,
    "roles": thisHook.authPass.roles.join(",")
  }

  iris.modules.triggers.globals.triggerEvent("page_visit", thisHook.authPass, params);

  thisHook.pass(data);

})

iris.modules.triggers.globals.registerAction("log", {

  message: {
    "type": "textarea",
    "title": "Message",
    "required": true
  },
  level: {
    "type": "text",
    "title": "Log level",
    "required": true,
    "enum": ["error", "info"]
  }

});

iris.modules.triggers.registerHook("hook_triggers_log", 0, function (thisHook, data) {

  iris.log(thisHook.context.params.level, thisHook.context.params.message)

  thisHook.pass(data);

})

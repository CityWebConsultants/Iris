iris.registerModule("actions");

iris.modules.actions.globals.actions = {};
iris.modules.actions.globals.events = {};

// Load in all actions on start

var fs = require('fs');
var glob = require("glob");

glob(iris.configPath + "/actions/*.json", function (er, files) {

  files.forEach(function (file) {

    var config = fs.readFileSync(file, "utf8");

    config = JSON.parse(config);

    if (config.name) {

      iris.saveConfig(config, "actions", iris.sanitizeFileName(config.name), function () {

        },
        function (fail) {

          console.log(fail);

        });
    }
  })

})

iris.modules.actions.globals.registerAction = function (name, parametersArray) {

  if (!parametersArray) {

    parametersArray = [];

  }

  iris.modules.actions.globals.actions[name] = {

    parameters: parametersArray

  }

}

iris.modules.actions.globals.registerEvent = function (name, parametersArray) {

  if (!parametersArray) {

    parametersArray = [];

  }

  if (!Array.isArray(parametersArray)) {

    iris.log("error", name + " actions parameters must be an array of strings");
    return false;

  }

  iris.modules.actions.globals.events[name] = {

    parameters: parametersArray

  }

}

iris.modules.actions.globals.triggerEvent = function (name, authPass, params) {

  if (typeof params !== "object") {

    var params = {};

  }

  iris.hook("hook_actions_event", authPass, {
    params: params,
    event: name,
  }).then(function (params) {

      // Check if any rules have been registered that grab this stuff

      Object.keys(iris.configStore.actions).forEach(function (rule) {

        // Flag for whether rule fires or not

        var fires = true;

        if (iris.configStore.actions[rule].events.event === name) {

          var rule = iris.configStore.actions[rule];

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

                iris.hook("hook_action_" + actionName, authPass, {
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

iris.modules.actions.registerHook("hook_form_render_actions", 0, function (thisHook, data) {

  if (!data.schema) {

    data.schema = {}

  }

  data.schema.name = {

    "title": "Name of action"

  }

  data.schema.event = {

    "title": "Event"

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

  Object.keys(iris.modules.actions.globals.events).forEach(function (eventType) {

    var tokens = [];

    iris.modules.actions.globals.events[eventType].parameters.forEach(function (token) {

      tokens.push("<small><b>[" + token + "]</b></small>");

    })

    events[eventType] = {
      "type": "object",
      "title": "This event provides the tokens " + tokens.join(",") + " which can be used as placeholders in the actions and conditions section of this form",
      "properties": {
        "conditions": {
          "title": "Conditions",
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "thing": {
                "type": "text",
                "title": "property",
                "enum": ["Pick a parameter"].concat(iris.modules.actions.globals.events[eventType].parameters)
              },
              "operator": {
                "type": "text",
                "title": "operator",
                "enum": ["is", "contains"]
              },
              "value": {
                "type": "text",
                "title": "value"
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
    "title": "Choose an event type"
  }

  Object.keys(events).forEach(function (event) {

    data.schema.events.properties[event] = events[event];

  })

  data.form.push({
    key: "events"
  })

  // Get list of actions and their fields

  var actions = {};

  Object.keys(iris.modules.actions.globals.actions).forEach(function (actionType) {

    var tokens = [];

    actions[actionType] = {
      "type": "object",
      "properties": iris.modules.actions.globals.actions[actionType].parameters
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
        "title": "Choose an action type"
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
    title: "Save action"
  });

  // Check if already submitted form exists

  if (thisHook.const.params[1] && thisHook.const.params[1].indexOf("{{") !== -1) {

    thisHook.finish(false);
    return false;

  }

  if (thisHook.const.params[1] && iris.configStore.actions[thisHook.const.params[1]]) {

    data.value = iris.configStore.actions[thisHook.const.params[1]];

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

  thisHook.finish(true, data);

})

// Register action save hook

iris.modules.actions.registerHook("hook_form_submit_actions", 0, function (thisHook, data) {

  // Juggle around schema for saving to make it more human readable

  Object.keys(thisHook.const.params).forEach(function (fieldName) {

    var field = thisHook.const.params[fieldName];

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

  iris.saveConfig(thisHook.const.params, "actions", iris.sanitizeFileName(thisHook.const.params.name), function (saved) {

    var data = function (res) {

      res.send("/admin/actions");

    };

    thisHook.finish(true, data);

  })

});

// Register actions create form

iris.app.get("/admin/actions/create", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_actions_form"], ['admin_wrapper'], {}, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

// Register actions create form

iris.app.get("/admin/actions/edit/:action", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_actions_form"], ['admin_wrapper'], {
    action: iris.sanitizeFileName(req.params.action)
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

iris.modules.menu.globals.registerMenuLink("admin-toolbar", null, "/admin/actions", "Actions");

// Main actions landing page

iris.app.get("/admin/actions", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_actions"], ['admin_wrapper'], {
    actions: iris.configStore.actions,
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})

// Delete action

iris.app.get("/admin/actions/delete/:name", function (req, res) {

  // If not admin, present 403 page

  if (req.authPass.roles.indexOf('admin') === -1) {

    iris.modules.frontend.globals.displayErrorPage(403, req, res);

    return false;

  }

  iris.modules.frontend.globals.parseTemplateFile(["admin_actions_delete"], ['admin_wrapper'], {
    action: req.params.name
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

iris.modules.actions.registerHook("hook_form_render_action_delete", 0, function (thisHook, data) {

  if (!data.schema) {

    data.schema = {};

  }

  data.schema["action"] = {
    type: "hidden",
    default: thisHook.const.params[1]
  };

  thisHook.finish(true, data);

});

iris.modules.actions.registerHook("hook_form_submit_action_delete", 0, function (thisHook, data) {

  var action = iris.sanitizeFileName(thisHook.const.params.action);

  if (iris.configStore.actions && iris.configStore.actions[action]) {

  } else {

    return false;

  }

  iris.deleteConfig("actions", action, function (err) {

    if (err) {

      thisHook.finish(false, data);

    }

    var data = function (res) {

      res.send("/admin/actions");

    };

    thisHook.finish(true, data);

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

iris.modules.actions.registerHook("hook_actions_event", 0, function (thisHook, data) {

  data = thisHook.const.params;

  thisHook.finish(true, data);

})

// Some default events and actions for logging messages on page view

iris.modules.actions.globals.registerEvent("page_visit", ["url", "userid", "role"]);

iris.modules.actions.registerHook("hook_request_intercept", 0, function (thisHook, data) {

  var params = {
    "url": thisHook.const.req.url,
    "userid": thisHook.authPass.userid,
    "roles": thisHook.authPass.roles.join(",")
  }

  iris.modules.actions.globals.triggerEvent("page_visit", thisHook.authPass, params);

  thisHook.finish(true, data);

})

iris.modules.actions.globals.registerAction("log", {

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

iris.modules.actions.registerHook("hook_action_log", 0, function (thisHook, data) {

  iris.log(thisHook.const.params.level, thisHook.const.params.message)

  thisHook.finish(true, data);

})

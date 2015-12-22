iris.registerModule("actions");

iris.modules.actions.globals.actions = {};
iris.modules.actions.globals.events = {};
iris.modules.actions.globals.rules = {};

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

iris.modules.actions.registerHook("hook_actions_event_ping", 0, function (thisHook, data) {

  data = thisHook.const.params;

  thisHook.finish(true, data);

})

iris.modules.actions.globals.triggerEvent = function (name, authPass, params) {

  if (typeof params !== "object") {

    params = {};

  }

  iris.hook("hook_actions_event_" + name, authPass, {
    params: params
  }).then(function (params) {

    // Check if any rules have been registered that grab this stuff

    Object.keys(iris.modules.actions.globals.rules).forEach(function (rule) {

      // Flag for whether rule fires or not

      var fires = true;

      if (iris.modules.actions.globals.rules[rule].event === name) {

        var rule = iris.modules.actions.globals.rules[rule];

        // Check if any conditions

        if (rule.conditions) {

          rule.conditions.forEach(function (condition) {

            // Slot in values if present

            Object.keys(params).forEach(function (parameter) {

              if (condition.value.indexOf("[" + parameter + "]") !== -1) {

                condition.value = params[parameter];

              }

              if (condition.thing.indexOf("[" + parameter + "]") !== -1) {

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

        console.log(fires);

      }


    })

  }, function (fail) {

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

    events[eventType] = {
      "type": "object",
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
    "type": "object"
  }

  data.schema.actions.properties = {};

  data.schema.actions.properties.action = {
    "type": "object",
    "properties": {
      "actions": {
        "type": "choose",
        "options": Object.keys(actions),
        "title": "Choose an action type"
      }
    }
  }

  Object.keys(actions).forEach(function (action) {

    data.schema.actions.properties[action] = actions[action];

  })

  data.form.push({
    key: "actions"
  })

  // Add submit button

  data.form.push({
    type: "submit",
    title: "Save action"
  });

  thisHook.finish(true, data);

})

// Register action save hook

iris.modules.actions.registerHook("hook_form_submit_actions", 0, function (thisHook, data) {

  // Loop over action parameters and store in a better way

  Object.keys(thisHook.const.params).forEach(function (paramName) {

    var param = thisHook.const.params[paramName];

    if (param.event) {

      console.log(param[param.event])

    }

  })

  iris.saveConfig(thisHook.const.params, "actions", iris.sanitizeFileName(thisHook.const.params.name), function (saved) {

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


iris.modules.actions.globals.registerEvent("ping", ["hello"]);
iris.modules.actions.globals.registerEvent("page", ["path", "userid"]);

iris.modules.actions.globals.registerAction("test", {

  message: {
    "type": "text",
    "title": "Message",
    "required": true
  }

});

iris.modules.actions.globals.registerAction("escape", {

  message: {
    "type": "textarea",
    "title": "ESCAPE THIS!",
    "description": "WHEN?!",
    "required": true
  }

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

      if (fields.length === 1) {

        parent = $(parent).parent();

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

    if (fields.length === 1) {

      parent = $(parent).parent();

      fields = $(parent).find(".jsonform-node");
      start = 1;

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

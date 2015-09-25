C.registerModule("forms");

CM.forms.globals.forms = {};

CM.forms.globals.makeForm = function (name, schema) {

  //Add hidden form ID field

  schema.formid = {
    "type": "hidden",
    "default": name
  };

  CM.forms.globals.forms[name] = {};
  CM.forms.globals.forms[name].name = name;
  CM.forms.globals.forms[name].schema = schema;

};

require("./example");

CM.forms.registerHook("hook_catch_request", 0, function (thisHook, data) {

  if (thisHook.const.req.method === "POST") {

    var body = thisHook.const.req.body;

    if (body && body.formid) {

      if (CM.forms.globals.forms[body.formid]) {

        C.hook("hook_form_submit", thisHook.const.req.authPass, {
          params: thisHook.const.req.body
        }).then(function (redirect) {

          C.hook("hook_form_submit_" + body.formid, thisHook.const.req.authPass, {
            params: thisHook.const.req.body
          }, null).then(function (redirect) {

            if (redirect) {

              data = function (req) {

                req.redirect(redirect);

              };

            }

            thisHook.finish(true, data);

          }, function (fail) {

            if (fail === "No such hook exists") {

              if (redirect) {

                data = function (req) {

                  req.redirect(redirect);

                };

              }

            }

            thisHook.finish(true, data);

          });

        }, function (fail) {

          thisHook.finish(true, data);

        });

      } else {

        thisHook.finish(true, data);

      }

    } else {

      thisHook.finish(true, data);

    }

  } else {

    thisHook.finish(true, data);

  }

});

var populateForm = function (form, authPass) {

  if (!form.form) {

    form.form = [];

  }

  Object.keys(form.schema).forEach(function (property) {

    form.form.push({
      key: property
    });

  });

  form.form.push({
    "type": "submit",
    "title": "Submit"
  })

  return new Promise(function (yes, no) {

    var name = form.name;

    C.hook("hook_form_render", authPass, form, form).then(function (form) {

      C.hook("hook_form_render_" + name, authPass, form, form).then(function (form) {

        yes(form);

      }, function (fail) {

        if (fail === "No such hook exists") {

          yes(form);

        } else {

          no(fail);

        }

      });

    });

  });

};

CM.forms.registerHook("hook_form_submit", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

CM.forms.registerHook("hook_form_render", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

//General form render hook

CM.forms.registerHook("hook_form_schema_alter", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

CM.frontend.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  CM.frontend.globals.parseBlock("form", data, function (formName, next) {

    // Check if form exists

    if (CM.forms.globals.forms[formName]) {

      var form = JSON.parse(JSON.stringify(CM.forms.globals.forms[formName]));

      form.context = thisHook.const.context;

      C.hook("hook_form_schema_alter", thisHook.authPass, form, form).then(function (form) {

        render(form);

      });

      var render = function (form) {

        C.hook("hook_form_schema_alter_" + formName, thisHook.authPass, form, form).then(function (form) {

            populateForm(form, thisHook.authPass).then(function (form) {

              var output = "<form method='POST' action='/' id='" + formName + "'></form>";

              output += "<script src='/modules/forms/jsonform/deps/underscore-min.js'></script><script src='/modules/forms/jsonform/lib/jsonform.js'></script><script>$('#" + formName + "').jsonForm(" + JSON.stringify(form) + ");</script>";

              next(output);

            });

          },
          function (fail) {

            if (fail === "No such hook exists") {

              populateForm(form, thisHook.authPass).then(function (form) {

                var output = "<form method='POST' action='/' id='" + formName + "'></form>";

                output += "<script src='/modules/forms/jsonform/deps/underscore-min.js'></script><script src='/modules/forms/jsonform/lib/jsonform.js'></script><script>$('#" + formName + "').jsonForm(" + JSON.stringify(form) + ");</script>";

                next(output);

              });

            } else {

              next("<!-- No handler for form " + formName + " -->");

            }

          });

      }

    } else {

      next("<!-- Could not find form " + formName + " -->");

    }

  }).then(function (html) {

    thisHook.finish(true, html);

  }, function (fail) {

    thisHook.finish(true, data);

  });

})

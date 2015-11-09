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
          params: thisHook.const.req.body,
          req: thisHook.const.req
        }).then(function (callback) {

          C.hook("hook_form_submit_" + body.formid, thisHook.const.req.authPass, {
            params: thisHook.const.req.body,
            req: thisHook.const.req
          }, null).then(function (callback) {

            thisHook.finish(true, callback);

          }, function (fail) {

            if (fail === "No such hook exists") {

              thisHook.finish(true, callback);

            } else {

              thisHook.finish(false, callback);

            }

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

      }, function (fail) {

        console.log(fail);

      });

    }, function (fail) {

      console.log(fail);

    });

  });

};

CM.forms.registerHook("hook_form_submit", 0, function (thisHook, data) {

  data = function(res){};

  thisHook.finish(true, data);

});

CM.forms.registerHook("hook_form_render", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

//General form render hook

CM.forms.registerHook("hook_form_schema_alter", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

CM.forms.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  CM.frontend.globals.parseBlock("form", data.html, function (formName, next) {
    
    formName = formName[0];

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

              var output = "<form method='POST' id='" + formName + "' ng-non-bindable ></form>";

              // Remove form context. Not needed any more and causes JSON stringify problems.

              delete form.context;

              try {
                output += "<script src='/modules/forms/jsonform/deps/underscore-min.js'></script><script src='/modules/forms/jsonform/lib/jsonform.js'></script><script>$('#" + formName + "').jsonForm(" + JSON.stringify(form) + ");</script>";

              } catch (e) {

                console.log(form);

                console.log(e);

              }

              next(output);

            }, function (fail) {

              console.log(fail);

            }, function (fail) {

              console.log(fail);

            });

          },
          function (fail) {

            if (fail === "No such hook exists") {

              populateForm(form, thisHook.authPass).then(function (form) {

                // Remove form context. Not needed any more and causes JSON stringify problems.

                delete form.context;

                var output = "<form method='POST' id='" + formName + "' ng-non-bindable ></form>";

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

    data.html = html;

    thisHook.finish(true, data);

  }, function (fail) {

    console.log(fail);

    thisHook.finish(true, data);

  });

})

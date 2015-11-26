C.registerModule("forms");

CM.forms.registerHook("hook_catch_request", 0, function (thisHook, data) {

  if (thisHook.const.req.method === "POST") {

    var body = thisHook.const.req.body;

    if (body && body.formid) {

      C.hook("hook_form_submit", thisHook.authPass, {
        params: thisHook.const.req.body,
        req: thisHook.const.req
      }).then(function (gremlin) {

        C.hook("hook_form_submit_" + body.formid, thisHook.authPass, {
          params: thisHook.const.req.body,
          req: thisHook.const.req
        }, null).then(function (callback) {

          if (typeof callback !== "function") {

            // If no callback is supplied provide a basic redirect to the same page

            var callback = function (res) {

              res.send(thisHook.const.req.url);

            }

            thisHook.finish(true, callback);

          } else {

            thisHook.finish(true, callback);

          }

        }, function (fail) {


          if (fail === "No such hook exists") {

            // Default form if not handler

            if (typeof gremlin !== "function") {

              // If no callback is supplied provide a basic redirect to the same page

              var callback = function (res) {

                res.send(thisHook.const.req.url);

              }

              thisHook.finish(true, gremlin);

            } else {

              thisHook.finish(true, gremlin);

            }

          } else {

            thisHook.finish(false, fail);

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

});

CM.forms.registerHook("hook_form_submit", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

CM.forms.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  var variables = data.variables;

  CM.frontend.globals.parseBlock("form", data.html, function (form, next) {

    var renderForm = function (form) {

      if (!form.schema) {

        form.schema = {}

      }

      // Add the form id in as a hidden field

      form.schema.formid = {
        "type": "hidden",
        "default": formName
      };

      // Unset form render object if not set (JSON form provides a default)

      if (!form.form || !Object.keys(form.form).length) {

        if (form.form) {

          delete form.form;

        }

      }

      // Unset form values object if not set

      if (!form.value || !Object.keys(form.value).length) {

        if (form.value) {

          delete form.value;

        }

      }

      var output = "";

      var toSource = require('tosource');

      output += "<form method='POST' id='" + formName + "' ng-non-bindable ></form> \n";
      output += "<script src='/modules/forms/jsonform/deps/underscore-min.js'></script><script src='/modules/forms/jsonform/deps/jquery.min.js'></script><script src='/modules/forms/jsonform/lib/jsonform.js'></script><script>$('#" + formName + "').jsonForm(" + toSource(form) + ");</script>";
      return output;

    };

    var formName = form[0];

    var formTemplate = {
      schema: {},
      form: {},
      value: {}
    }

    formTemplate.onSubmit = function (errors, values) {

      $.post(window.location, values, function (data, err) {

        window.location.href = data;

      })

    };

    C.hook("hook_form_render", thisHook.authPass, {
      formId: form[0],
      params: form
    }, formTemplate).then(function (formTemplate) {

      C.hook("hook_form_render_" + formName, thisHook.authPass, {
        formId: form[0],
        params: form
      }, formTemplate).then(function (form) {

        next(renderForm(form));

      }, function (fail) {

        if (fail = "No such hook exists") {

          next(false);

        }

        next(false);

      });

    }, function (fail) {

      next(false);

    });
  }).then(function (html) {

    data.html = html;

    thisHook.finish(true, data);

  }, function (fail) {

    thisHook.finish(true, data);

  })

});

// Default hook form render

CM.forms.registerHook("hook_form_render", 0, function (thisHook, data) {

  thisHook.finish(true, data);

})

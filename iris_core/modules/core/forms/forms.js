iris.registerModule("forms");

// Store of rendered form keys to check if form has already been submitted and stop cross site scripting problems with re-rendered forms

iris.modules.forms.globals.formRenderCache = {};

var toSource = require('tosource');

iris.modules.forms.registerHook("hook_catch_request", 0, function (thisHook, data) {

  if (thisHook.const.req.method === "POST") {

    var body = thisHook.const.req.body;

    if (body && body.formid && body.formToken) {

      // Check if form id exists in cache, if not stop

      if (iris.modules.forms.globals.formRenderCache[body.formToken]) {

        var token = iris.modules.forms.globals.formRenderCache[body.formToken];

        if (token.authPass.userid === thisHook.authPass.userid && body.formid === token.formid) {

        } else {

          thisHook.finish(false, "Bad request");
          return false;

        }

      } else {

        thisHook.finish(false, "Bad request");
        return false;

      }

      delete body.formToken;

      var formid = body.formid;

      delete body.formid;

      delete thisHook.const.req.body.formToken;
      delete thisHook.const.req.body.formid;

      iris.hook("hook_form_submit", thisHook.authPass, {
        params: body,
        formid: formid,
        req: thisHook.const.req
      }).then(function (gremlin) {

        iris.hook("hook_form_submit_" + formid, thisHook.authPass, {
          params: body,
          formid: formid,
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

          // Stop form being submitted a second time

          //          delete iris.modules.forms.globals.formRenderCache[body.formToken];

        }, function (fail) {


          if (fail === "No such hook exists") {

            // Default form if not handler

            if (typeof gremlin !== "function") {

              // If no callback is supplied provide a basic redirect to the same page

              var callback = function (res) {

                res.send({
                  errors: fail
                });

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

iris.modules.forms.registerHook("hook_form_submit", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

iris.modules.forms.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  var variables = data.variables;

  iris.modules.frontend.globals.parseBlock("form", data.html, function (form, next) {

    var formParams = form.join(",");

    var renderForm = function (form, callback) {

      if (!form.schema) {

        form.schema = {}

      }

      // Add the form id in as a hidden field

      form.schema.formid = {
        "type": "hidden",
        "default": formName
      };

      // Crete a form token and add to form

      var crypto = require('crypto');

      crypto.randomBytes(16, function (ex, buf) {

        var token = buf.toString('hex');

        iris.modules.forms.globals.formRenderCache[token] = {
          formid: formName,
          authPass: thisHook.authPass
        };

        form.schema.formToken = {
          "type": "hidden",
          "default": token
        };

        // Unset form render object if not set (JSON form provides a default)

        if (!form.form || !form.form.length) {

          if (form.form) {

            delete form.form;

          }

        } else {

          form.form.push({
            key: "formToken"
          });
          form.form.push({
            key: "formid"
          });

        }

        // Unset form values object if not set

        if (!form.value || !Object.keys(form.value).length) {

          if (form.value) {

            delete form.value;

          }

        } else {

          form.value.formid = formName;
          form.value.formToken = token;

        }

        var output = "";

        output += "<form data-params=" + formParams + " method='POST' id='" + formName + "' ng-non-bindable ></form> \n";

        // Add in any custom widgets

        output += '<script src="/modules/admin_ui/jsonform/deps/jquery.min.js"></script><script src="/modules/admin_ui/jsonform/deps/underscore-min.js"></script><script src="/modules/admin_ui/jsonform/deps/opt/jquery.ui.custom.js"></script><script src="/modules/admin_ui/jsonform/deps/opt/bootstrap-dropdown.js"></script><script src="/modules/admin_ui/jsonform/deps/opt/bootstrap-typeahead.js"></script><script src="/modules/admin_ui/jsonform/deps/opt/bootstrap-tagsinput.min.js"></script><script src="/modules/admin_ui/jsonform/deps/opt/spectrum.js"></script><script src="/modules/admin_ui/jsonform/deps/opt/jquery.transloadit2.js"></script><script src="/modules/admin_ui/jsonform/lib/jsonform.js"></script>';

        output += "<script>";

        Object.keys(iris.modules.forms.globals.widgets).forEach(function (widget) {

          output += "var " + widget + " = " + iris.modules.forms.globals.widgets[widget] + "()";
          output += "\n";

        });

        output += "</script>";

        output += "<script>$('#" + formName + "').jsonForm(" + toSource(form) + ");</script>";
        callback(output);

      });

    };

    var formName = form[0];

    var formTemplate = {
      schema: {},
      form: {},
      value: {}
    }

    formTemplate.onSubmit = function (errors, values) {

      $.post(window.location, values, function (data, err) {

        if (data.errors) {

          console.log(data.errors);

        } else {

          window.location.href = data;

        }

      })

    };

    iris.hook("hook_form_render", thisHook.authPass, {
      formId: form[0],
      params: form
    }, formTemplate).then(function (formTemplate) {

      iris.hook("hook_form_render_" + formName, thisHook.authPass, {
        formId: form[0],
        params: form
      }, formTemplate).then(function (form) {

        renderForm(form, function (output) {

          next(output);

        });

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

iris.modules.forms.registerHook("hook_form_render", 0, function (thisHook, data) {

  thisHook.finish(true, data);

})

iris.modules.forms.globals.widgets = {};

// Allow custom form widget types

iris.modules.forms.globals.registerWidget = function (widgetFunction, name) {

  iris.modules.forms.globals.widgets[name] = toSource(widgetFunction);

}

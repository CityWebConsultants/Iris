/**
 * @file Provides hooks and functions to create forms for use on the frontend
 */

/**
 * @namespace forms
 */

iris.registerModule("forms");

// Store of rendered form keys to check if form has already been submitted and stop cross site scripting problems with re-rendered forms

iris.modules.forms.globals.formRenderCache = {};

var toSource = require('tosource');

/**
 * Request handler hook
 *
 * Used to respond to an HTTP request.
 */
/*
 * hook_catch_request is used here to respond to form submissions.
 */
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
      }).then(function (callbackfunction) {

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

            if (typeof callbackfunction !== "function") {

              // If no callback is supplied provide a basic redirect to the same page

              var callback = function (res) {

                res.send({
                  errors: fail
                });

              }

              thisHook.finish(true, callbackfunction);

            } else {

              thisHook.finish(true, callbackfunction);

            }

          } else {

            var callback = function (res) {

              res.send({
                errors: fail
              });

            }

            thisHook.finish(true, callback);

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

/**
 * @member hook_form_validate
 * @memberof forms
 *
 * @desc Generic form validation handler
 *
 * Use this hook to implement a handler on all submitted forms.
 *
 * The form fields are available keyed under thisHook.const.params.
 *
 * It is easier to handle validation of a single form by appending _ followed by the form name to this hook.
 *
 * @see hook_form_submit_<form_name>
 */
iris.modules.forms.registerHook("hook_form_validate", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

/**
 * @member hook_form_submit
 * @memberof forms
 *
 * @desc Generic form submission handler
 *
 * Use this hook to implement a handler on all submitted forms.
 *
 * The form fields are available keyed under thisHook.const.params.
 *
 * It is easier to handle submission of a single form by appending _ followed by the form name to this hook.
 *
 * @see hook_form_submit_<form_name>
 */
iris.modules.forms.registerHook("hook_form_submit", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

/*
 * This implementation of hook_frontend_template_parse adds a "form" block.
 */
iris.modules.forms.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  iris.modules.frontend.globals.parseEmbed("form", data.html, function (form, next) {

    // Add scripts for forms

    data.variables.tags.headTags["jQuery"] = {
      type: "script",
      attributes: {
        "src": "/modules/admin_ui/jsonform/deps/jquery.min.js"
      },
      rank: 0
    }

    data.variables.tags.headTags["underscore"] = {
      type: "script",
      attributes: {
        "src": "/modules/admin_ui/jsonform/deps/underscore-min.js"
      },
      rank: 0
    }
    data.variables.tags.headTags["jQueryUI"] = {
      type: "script",
      attributes: {
        "src": "/modules/admin_ui/jsonform/deps/opt/jquery.ui.custom.js"
      },
      rank: 1
    }
    data.variables.tags.headTags["bootstrap-dropdown"] = {
      type: "script",
      attributes: {
        "src": "/modules/admin_ui/jsonform/deps/opt/bootstrap-dropdown.js"
      },
      rank: 2
    }
    data.variables.tags.headTags["jsonform"] = {
      type: "script",
      attributes: {
        "src": "/modules/admin_ui/jsonform/lib/jsonform.js"
      },
      rank: 3
    }

    //

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

        var uniqueId = formName + Date.now().toString();

        output += "<form data-params=" + formParams + " method='POST' id='" + uniqueId + "' ng-non-bindable ></form> \n";

        // Add in any custom widgets

        output += "<script>";

        Object.keys(iris.modules.forms.globals.widgets).forEach(function (widget) {

          output += "var " + widget + " = " + iris.modules.forms.globals.widgets[widget] + "()";
          output += "\n";

        });

        output += "</script>";

        output += "<script>$('#" + uniqueId + "').jsonForm(" + toSource(form) + ");</script>";
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

          $("html, body").animate({
            scrollTop: 0
          }, "slow");

          $("#" + values.formid).prepend("<div class='form-errors'>" + data.errors + "</div>")

        } else if (data.redirect) {

          window.location.href = data.redirect;

        } else {

          if (data && data.indexOf("doctype") === -1) {

            window.location.href = data;

          } else {

            window.location.href = window.location.href;

          }

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

/**
 * @memberof forms
 *
 * @desc Prepare a form for display by adding or changing fields at the render stage
 */
iris.modules.forms.registerHook("hook_form_render", 0, function (thisHook, data) {

  thisHook.finish(true, data);

})

iris.modules.forms.globals.widgets = {};

/**
 * @function registerWidget
 * @memberof forms
 *
 * @desc Register a new form widget type
 *
 * Widgets consist of a name and a function that is sent to the client to implement a custom form item.
 *
 * @param {function} widgetFunction - Function that is executed client-side when the form is displayed.
 * @param {string} name - The widget name.
 */
iris.modules.forms.globals.registerWidget = function (widgetFunction, name) {

  iris.modules.forms.globals.widgets[name] = toSource(widgetFunction);

}

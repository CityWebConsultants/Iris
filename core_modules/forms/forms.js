C.registerModule("forms");

var toSource = require('tosource');

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

      output += "<form method='POST' id='" + formName + "' ng-non-bindable ></form> \n";

      // Add in any custom widgets

      output += "<script>";

      Object.keys(CM.forms.globals.widgets).forEach(function (widget) {

        output += "var " + widget + " = " + CM.forms.globals.widgets[widget] + "()";

      });

      output += "</script>";

      output += "<script>$('#" + formName + "').jsonForm(" + toSource(form) + ");</script>";
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

CM.forms.globals.widgets = {};

// Allow custom form widget types

CM.forms.globals.registerWidget = function (widgetFunction, name) {

  CM.forms.globals.widgets[name] = toSource(widgetFunction);

}

CM.forms.globals.registerWidget(function () {

  JSONForm.elementTypes['ckeditor'] = Object.create(JSONForm.elementTypes['text']);

  JSONForm.elementTypes['ckeditor'].template = '<textarea class="ckeditor" id="<%= id %>" name="<%= node.name %>" ' +
    'style="height:<%= elt.height || "150px" %>;width:<%= elt.width || "100%" %>;"' +
    '<%= (node.disabled? " disabled" : "")%>' +
    '<%= (node.readOnly ? " readonly=\'readonly\'" : "") %>' +
    '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
    '<%= (node.schemaElement && node.schemaElement.required ? " required=\'required\'" : "") %>' +
    '<%= (node.placeholder? "placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
    '><%= value %></textarea>';
  JSONForm.elementTypes['ckeditor'].fieldTemplate = true;
  JSONForm.elementTypes['ckeditor'].inputfield = true;

}, "CKeditor");

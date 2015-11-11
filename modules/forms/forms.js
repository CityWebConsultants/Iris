C.registerModule("forms");

CM.forms.registerHook("hook_catch_request", 0, function (thisHook, data) {

  if (thisHook.const.req.method === "POST") {

    var body = thisHook.const.req.body;

    if (body && body.formid) {

      C.hook("hook_form_submit", thisHook.const.req.authPass, {
        params: thisHook.const.req.body,
        req: thisHook.const.req
      }).then(function (output) {

        C.hook("hook_form_submit_" + body.formid, thisHook.const.req.authPass, {
          params: thisHook.const.req.body,
          req: thisHook.const.req
        }, null).then(function (callback) {

          if (typeof callback !== "function") {

            // If no callback is supplied provide a basic redirect to the same page

            var callback = function (res) {

              res.redirect(req.url);

            }

          } else {

            thisHook.finish(true, callback);

          }

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

});

CM.forms.registerHook("hook_form_submit", 0, function (thisHook, data) {

  thisHook.finish(true, data);

});

CM.forms.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  var variables = data.variables;

  CM.frontend.globals.parseBlock("form", data.html, function (form, next) {

    var formName = form[0];

    C.hook("hook_form_render_" + formName, thisHook.authPass, null, {
      schema: {},
      form: {},
      value: {}
    }).then(function (form) {

      if (form.schema) {

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
        output += "<script src='/modules/forms/jsonform/deps/underscore-min.js'></script><script src='/modules/forms/jsonform/lib/jsonform.js'></script><script>$('#" + formName + "').jsonForm(" + JSON.stringify(form) + ");</script>";

        next(output);

      } else {

        next("<!-- Failed to load form -->");

      }

    }, function (fail) {

      next("<!-- Failed to load form -->");

    });

  }).then(function (html) {

    data.html = html;

    thisHook.finish(true, data);

  }, function (fail) {

    thisHook.finish(true, data);

  });

});

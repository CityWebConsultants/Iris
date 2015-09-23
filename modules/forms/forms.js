C.registerModule("forms");

CM.forms.globals.forms = {};

CM.forms.globals.makeForm = function (name, form) {

  if (form.schema) {

    form.schema.formid = {
      "type": "hidden",
      "default": name
    };

  }

  CM.forms.globals.forms[name] = {};
  CM.forms.globals.forms[name].name = name;
  CM.forms.globals.forms[name].config = form;

};

require("./example");

CM.forms.registerHook("hook_catch_request", 0, function (thisHook, data) {

  if (thisHook.const.req.method === "POST") {

    var body = thisHook.const.req.body;

    if (body && body.formid) {

      if (CM.forms.globals.forms[body.formid]) {

        C.hook("hook_form_submit_" + body.formid, thisHook.const.req.authPass, {
          params: thisHook.const.req.body
        }, null).then(function (redirect) {

          if (redirect) {

            data = function (req) {

              req.redirect(redirect);

            };

          };

          thisHook.finish(true, data);

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

CM.frontend.registerHook("hook_frontend_template_parse", 0, function (thisHook, data) {

  CM.frontend.globals.parseBlock("form", data, function (formName, next) {

    // Check if form exists

    if (CM.forms.globals.forms[formName]) {

      C.hook("hook_form_render_" + formName, thisHook.authPass, CM.forms.globals.forms[formName], CM.forms.globals.forms[formName]).then(function (form) {

          var output = "<form method='POST' action='/' id='" + formName + "'></form>";

          output += "<script src='/modules/forms/jsonform/deps/underscore-min.js'></script><script src='/modules/forms/jsonform/lib/jsonform.js'></script><script>$('#" + formName + "').jsonForm(" + JSON.stringify(form.config) + ");</script>";

          next(output);

        },
        function (fail) {

          if (fail === "No such hook exists") {


            var output = "<form method='POST' action='/' id='" + formName + "'></form>";

            output += "<script src='/modules/forms/jsonform/deps/underscore-min.js'></script><script src='/modules/forms/jsonform/lib/jsonform.js'></script><script>$('#" + formName + "').jsonForm(" + JSON.stringify(CM.forms.globals.forms[formName].config) + ");</script>";

            next(output);


          } else {

            next("<!-- No handler for form " + formName + " -->");

          }

        });

    } else {

      next("<!-- Could not find form " + formName + " -->");

    }

  }).then(function (html) {

    thisHook.finish(true, html);

  }, function (fail) {

    thisHook.finish(true, data);

  });

})

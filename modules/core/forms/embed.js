var toSource = require('tosource');

/*
 * This implementation of hook_frontend_embed adds a "form" block.
 */
iris.modules.forms.registerHook("hook_frontend_embed__form", 0, function (thisHook, data) {

  if (!thisHook.context.embedOptions.formID) {

    thisHook.fail("No formID");

    return false;

  }

  var variables = thisHook.context.vars;

  // Add scripts for forms

  variables.tags.headTags.jQuery = {
    type: "script",
    attributes: {
      "src": "/modules/forms/jsonform/deps/jquery.min.js"
    },
    rank: 0
  };

  variables.tags.headTags.underscore = {
    type: "script",
    attributes: {
      "src": "/modules/forms/jsonform/deps/underscore-min.js"
    },
    rank: 0
  };
  variables.tags.headTags.jQueryUI = {
    type: "script",
    attributes: {
      "src": "/modules/forms/jsonform/deps/opt/jquery.ui.custom.js"
    },
    rank: 1
  };

  variables.tags.headTags["bootstrap-dropdown"] = {
    type: "script",
    attributes: {
      "src": "/modules/forms/jsonform/deps/opt/bootstrap-dropdown.js"
    },
    rank: 2
  };
  variables.tags.headTags["jsonform"] = {
    type: "script",
    attributes: {
      "src": "/modules/forms/jsonform/lib/jsonform.js"
    },
    rank: 1
  };

  variables.tags.headTags["extrafields"] = {
    type: "script",
    attributes: {
      "src": "/modules/forms/extrafields.js"
    },
    rank: 2
  };

  variables.tags.headTags["clientforms"] = {
    type: "script",
    attributes: {
      "src": "/modules/forms/clientforms.js"
    },
    rank: 4
  };

  variables.tags.headTags["formscss"] = {
    type: "link",
    attributes: {
      "href": "/modules/forms/forms.css",
      "rel": "stylesheet"
    },
    rank: 4
  };

  //

  var formParams = thisHook.context.embedOptions;

  var renderForm = function (form, callback) {

    if (!form.schema) {

      form.schema = {};

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
        userid: thisHook.authPass.userid,
        date: Date.now()
      };

      form.schema.formToken = {
        "type": "hidden",
        "default": token
      };

      form.schema.formPrevious = {
        "type": "hidden",
        "default": JSON.stringify(form)
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

        form.form.push({
          key: "formPrevious"
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

      var uniqueId = formName + token;


      output = "<form data-params='" + formParams + "' method='POST' data-formid='" + formName + "' id='" + uniqueId + "' ng-non-bindable ></form> \n";

      output += "<script>iris.forms['" + uniqueId + "'] = { form: " + toSource(form) + ", onComplete: 'formComplete_" + formName + "'}" + "\n if(typeof iris.forms.renderForm == \"function\") iris.forms.renderForm('" + uniqueId + "');</script>";

      // Client side form parsing - check if dynamicform variable passed

      if (form.dynamicForm) {

        output += "<noscript>" + thisHook.authPass.t("You need JavaScript enabled to display this form") + "</noscript>";

        callback(output);

        return false;

      }

      var jsdom = require("jsdom");

      var action = "";

      if (thisHook.context.vars.req) {

        var url = require("url");
        var querystring = require("querystring");

        // See if an existing query string exists so as to not overwrite it

        var query = JSON.parse(JSON.stringify(thisHook.context.vars.req.query));

        if (!query.nojs) {
          query.nojs = true;
        }

        var actionURL = url.parse(thisHook.context.vars.req.url).pathname + "?" + querystring.stringify(query);

        action = "action='" + actionURL + "'";

      }

      // Load in requirements

      var fs = require("fs");

      var core = fs.readFileSync(iris.modules.frontend.path + "/static/iris_core.js", "utf-8");
      var jquery = fs.readFileSync(iris.modules.forms.path + "/static/jsonform/deps/jquery.min.js", "utf-8");
      var underscore = fs.readFileSync(iris.modules.forms.path + "/static/jsonform/deps/underscore-min.js", "utf-8");
      var jsonform = fs.readFileSync(iris.modules.forms.path + "/static/jsonform/lib/jsonform.js", "utf-8");

      // Put in extra fields

      var extrafields = "";

      extrafields = "iris.forms = {};" + "\n";

      Object.keys(iris.modules.forms.globals.widgets).forEach(function (field) {

        extrafields += "iris.forms['" + field + "'] = " + iris.modules.forms.globals.widgets[field] + "();\n" + "\n";

      });

      var static = `<form ${action} data-static-form method="post" id="${uniqueId}"></form>`;

      var respond = function (staticForm) {

        callback(staticForm + output);

      };

      var staticFormSetupCode = `window.form = ${toSource(form)}`;

      jsdom.env({
        html: staticFormSetupCode + static,
        src: [core, jquery, underscore, jsonform, extrafields, staticFormSetupCode],
        onload: function (window) {

          window.$('#' + uniqueId).jsonForm(window.form);

          var formOutput = window.$("[data-static-form]")[0].outerHTML;

          respond(formOutput);

        }
      });
    });

  };

  var formName = thisHook.context.embedOptions.formID;
  thisHook.context.embedID = formName;

  var formTemplate = {
    schema: {},
    form: [],
    value: {}
  };

  iris.invokeHook("hook_form_render", thisHook.authPass, {
    formId: thisHook.context.embedID,
    params: formParams,
    context: variables
  }, formTemplate).then(function (formTemplate) {

    iris.invokeHook("hook_form_render__" + formName, thisHook.authPass, {
      formId: thisHook.context.embedID,
      params: formParams,
      context: variables
    }, formTemplate).then(function (form) {

      renderForm(form, function (output) {

        thisHook.pass(output);

      });

    }, function (fail) {

      thisHook.fail();

    });

  }, function (fail) {

    thisHook.fail();

  });

});

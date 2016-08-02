/**
 * @file Provides hooks and functions to create forms for use on the frontend
 */

/**
 * @namespace forms
 */

iris.registerModule("forms", __dirname);

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

  // Call submit handlers that specify the form name
  var specificFormSubmit = function (data) {

    if (typeof data !== "function") {

      thisHook.pass(function (res) {

        res.json(data);

      });

    } else {

      thisHook.pass(data);

    }

  };

  // Call all generic submit handlers.
  var genericFormSubmit = function (data) {

    var previous = body.formPrevious;

    delete body.formPrevious;

    iris.invokeHook("hook_form_submit__" + formid, thisHook.authPass, {
      params: body,
      formid: formid,
      previous: previous,
      req: thisHook.context.req,
      res: thisHook.context.res
    }, data).then(specificFormSubmit, function (fail) {

      var errors;

      if (typeof fail === "string") {

        errors = [{
          message: fail
        }];

      } else {

        errors = fail;

      }

      thisHook.pass(function (res) {

        res.json({
          errors: errors
        });

      });

    });

  };

  // Run all validation hooks specific to the form being procesed.
  var specificFormValidate = function (data) {

    // If any errors were found, do not trigger submit handlers.
    if (data.errors && data.errors.length > 0) {

      var callback = function (res) {

        res.json({
          errors: data.errors
        });

      };

      thisHook.pass(callback);

    } else {
      iris.invokeHook("hook_form_submit", thisHook.authPass, {
        params: body,
        formid: formid,
        req: thisHook.context.req
      }, data).then(genericFormSubmit, function (fail) {

        thisHook.fail(fail);

      });
    }
  };

  var genericFormValidate = function (data) {

    iris.invokeHook("hook_form_validate__" + formid, thisHook.authPass, {
      params: body,
      formid: formid,
      req: thisHook.context.req
    }, data).then(specificFormValidate, function (fail) {

      thisHook.fail(fail);

    });

  };



  if (thisHook.context.req.method === "POST") {

    // Check if posted without JavaScript

    var nojs;

    if (thisHook.context.req.query && thisHook.context.req.query.nojs) {

      nojs = true;
      var nativeJSON = thisHook.context.res.json;
      thisHook.context.res.json = function (body) {

        if (body.redirect || body.callback) {

          thisHook.context.res.redirect(body.redirect);

        } else {

          thisHook.context.res.redirect(thisHook.context.req.url);

        }

      };

    }

    var body = thisHook.context.req.body;

    if (body && body.formid && body.formToken) {

      // Check if form id exists in cache, if not stop

      if (iris.modules.forms.globals.formRenderCache[body.formToken]) {

        var token = iris.modules.forms.globals.formRenderCache[body.formToken];

        if (token.userid === thisHook.authPass.userid && body.formid === token.formid) {

        } else {

          thisHook.fail("Bad request");
          return false;

        }

      } else {

        thisHook.fail("Bad request");
        return false;

      }

      delete body.formToken;

      var formid = body.formid;

      delete body.formid;

      delete thisHook.context.req.body.formToken;
      delete thisHook.context.req.body.formid;


      iris.invokeHook("hook_form_validate", thisHook.authPass, {
        params: body,
        formid: formid,
        req: thisHook.context.req
      }, {
        errors: [],
        messages: [],
        callback: null
      }).then(genericFormValidate, function (fail) {

        thisHook.pass(data);

      });



    } else {

      thisHook.pass(data);

    }

  } else {

    thisHook.pass(data);

  }



});


/**
 * @member hook_form_submit
 * @memberof forms
 *
 * @desc Generic form submission handler
 *
 * Use this hook to implement a handler on all submitted forms.
 *
 * The form fields are available keyed under thisHook.context.params.
 *
 * It is easier to handle submission of a single form by appending _ followed by the form name to this hook.
 *
 * @see hook_form_submit_<form_name>
 */
iris.modules.forms.registerHook("hook_form_submit", 0, function (thisHook, data) {

  thisHook.pass(data);

});

iris.route.get("/modules/forms/extrafields.js", function (req, res) {

  var output = "iris.forms = {};" + "\n";

  Object.keys(iris.modules.forms.globals.widgets).forEach(function (field) {

    output += "iris.forms['" + field + "'] = " + iris.modules.forms.globals.widgets[field] + "();\n" + "\n";

  });

  res.setHeader('content-type', 'application/javascript');
  res.send(output);

});

/*
 * This implementation of hook_frontend_template_parse adds a "form" block.
 */
iris.modules.forms.registerHook("hook_frontend_embed__form", 0, function (thisHook, data) {

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
        userid: thisHook.authPass.userid
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

  var formName = thisHook.context.embedID;

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

      if (fail === "No such hook exists") {

        renderForm(formTemplate, function (output) {

          thisHook.pass(output);

        });

      } else {

        thisHook.fail();

      }

    });

  }, function (fail) {

    thisHook.fail();

  });

});

/**
 * @memberof forms
 *
 * @desc Prepare a form for display by adding or changing fields at the render stage
 */
iris.modules.forms.registerHook("hook_form_render", 0, function (thisHook, data) {

  thisHook.pass(data);

});

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

};

/**
 * Register custom JSON form field for simple HTML.
 */
iris.modules.forms.globals.registerWidget(function () {

  JSONForm.elementTypes['markup'] = Object.create(JSONForm.elementTypes['text']);
  JSONForm.elementTypes['markup'].template = '<% if(value && !node.markup){node.markup = value} %><%= node.markup ? node.markup : node.schemaElement.markup  %>';
  JSONForm.elementTypes['markup'].fieldTemplate = true;
  JSONForm.elementTypes['markup'].inputfield = true;

}, "markup");

/**
 * Replace standard input submit with button that includes a loading gif.
 */
iris.modules.forms.globals.registerWidget(function () {

  JSONForm.elementTypes['submit'].template = ' <button type="submit" <% if (id) { %> id="<%= id %>" <% } %> class="btn btn-primary has-spinner <%= cls.buttonClass %> <%= elt.htmlClass?elt.htmlClass:"" %>"><%= value || node.title %><span class="spinner"><i class="glyphicon-refresh-animate glyphicon glyphicon-refresh"></i></span></button> ';

}, "submit");

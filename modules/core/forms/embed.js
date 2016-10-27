var toSource = require('tosource');
var noJSEmbed = require("./nojsembed");

var renderForm = function (formName, formParams, form, authPass, callback, req) {

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

    // Add form object to formRenderCache

    iris.modules.forms.globals.formRenderCache[token] = {
      formid: formName,
      userid: authPass.userid,
      date: Date.now(),
      form: form
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

    var uniqueId = formName + token;

    output = "<form data-params='" + formParams + "' method='POST' data-formid='" + formName + "' id='" + uniqueId + "' ng-non-bindable ></form> \n";

    output += "<script>iris.forms['" + uniqueId + "'] = { form: " + toSource(form) + ", onComplete: 'formComplete_" + formName + "'}" + "\n if(typeof iris.forms.renderForm == \"function\") iris.forms.renderForm('" + uniqueId + "');</script>";

    // Client side form parsing - check if dynamicform variable passed

    if (form.dynamicForm || typeof req === "undefined") {

      output += "<noscript>" + authPass.t("You need JavaScript enabled to display this form") + "</noscript>";

      callback(output);

      return false;

    }

    noJSEmbed(form, uniqueId, output, req, callback);

  });

};

/*
 * This implementation of hook_frontend_embed adds a "form" block.
 */
iris.modules.forms.registerHook("hook_frontend_embed__form", 0, function (thisHook, data) {

  if (thisHook.context.embedOptions.formID) {

    console.warn('"formid" embed parameter has been changed to "name". You should change the template embed code for form "' + thisHook.context.embedOptions.formID + '"');

    thisHook.context.embedOptions.name = thisHook.context.embedOptions.formID;
    
    delete thisHook.context.embedOptions.formID;

  }

  if (!thisHook.context.embedOptions.name) {

    thisHook.fail("No form name");

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

  var formParams = thisHook.context.embedOptions;

  var formName = thisHook.context.embedOptions.name;
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

      renderForm(formName, formParams, form, thisHook.authPass, function (output) {

        thisHook.pass(output);

      }, thisHook.context.vars.req);

    }, function (fail) {

      thisHook.fail();

    });

  }, function (fail) {

    thisHook.fail();

  });

});

var toSource = require('tosource');
var jsdom = require("jsdom");

module.exports = function (form, uniqueId, output, req, callback) {

  var action = "";

  var url = require("url");
  var querystring = require("querystring");

  // See if an existing query string exists so as to not overwrite it

  var query = JSON.parse(JSON.stringify(req.query));

  if (!query.nojs) {
    query.nojs = true;
  }

  var actionURL = url.parse(req.url).pathname + "?" + querystring.stringify(query);

  action = "action='" + actionURL + "'";

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
};

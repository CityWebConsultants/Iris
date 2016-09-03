var toSource = require('tosource');

iris.route.get("/modules/forms/extrafields.js", function (req, res) {

  var output = "iris.forms = {};" + "\n";

  Object.keys(iris.modules.forms.globals.widgets).forEach(function (field) {

    output += "iris.forms['" + field + "'] = " + iris.modules.forms.globals.widgets[field] + "();\n" + "\n";

  });

  res.setHeader('content-type', 'application/javascript');
  res.send(output);

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

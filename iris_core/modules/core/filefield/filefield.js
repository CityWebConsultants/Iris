/**
 * @file Provides a file upload field for entity forms
 */

/**
 * @namespace filefield
 */

iris.registerModule("filefield");

var busboy = require('connect-busboy');

iris.app.use(busboy());

var fs = require('fs');

iris.app.post('/admin/file/fileFieldUpload/:filename/:form/:parameters', function (req, res) {

  // Make temp file directory and files directory if they don't exist

  var mkdirSync = function (path) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      if (e.code != 'EEXIST') throw e;
    }
  }

  mkdirSync(iris.sitePath + "/" + "temp");

  mkdirSync(iris.sitePath + "/" + "files");

  req.pipe(req.busboy);

  req.busboy.on('file', function (fieldname, file, filename) {

    var ws = fs.createWriteStream(iris.sitePath + '/temp/' + filename);
    file.pipe(ws);

    ws.on('close', function () {
      res.end(filename);
    });

  });

});

iris.modules.auth.globals.registerPermission("Can upload files", "files");

// Register file field widget

iris.modules.forms.globals.registerWidget(function () {

  JSONForm.elementTypes['file'] = Object.create(JSONForm.elementTypes['text']);

  JSONForm.elementTypes['file'].template = '<%= value ? "Current file: " + escape(value) : ""  %><input class="filefield" type="file" ' +
    '<%= (fieldHtmlClass ? "class=\'" + fieldHtmlClass + "\' " : "") %>' +
    'name="FILEFIELD<%= node.name %>" value="<%= escape(value) %>" id="FILEFIELD<%= id %>"' +
    '<%= (node.disabled? " disabled" : "")%>' +
    '<%= (node.readOnly ? " readonly=\'readonly\'" : "") %>' +
    '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
    '<%= (node.schemaElement && node.schemaElement.required && (node.schemaElement.type !== "boolean") ? " required=\'required\'" : "") %>' +
    '<%= (node.placeholder? "placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
    ' /><input style="display:none" id="<%= id %>" type="text" value="<%= escape(value) %>" name="<%= node.name %>" />';
  JSONForm.elementTypes['file'].fieldTemplate = true;
  JSONForm.elementTypes['file'].inputfield = true;

  $(document).ready(function () {

    $("input.filefield").on("change", function (data) {

      var fileInput = data.target;
      var file = fileInput.files[0];
      var formData = new FormData();
      formData.append('file', file);

      var id = $(data.target).attr("id").replace("FILEFIELD", "");

      var parentForm = $(fileInput).closest("form")[0];

      // Get form parameters

      var params = $(parentForm).attr("data-params").split(",");;

      var formID = $(parentForm).attr("id");

      var id = id.substring(id.indexOf("elt-") + 4);

      $.ajax({
        url: '/admin/file/fileFieldUpload/' + id + "/" + formID + "/" + JSON.stringify(params),
        type: 'POST',
        data: formData,
        contentType: false,
        processData: false,
      }).done(function (response) {

        $("input[name=" + id + "]").attr("value", response);

      });

    });

  });

}, "file");

// Field save handler

iris.modules.filefield.registerHook("hook_entity_field_fieldType_save__file", 0, function (thisHook, data) {

  var value = thisHook.const.value;

  // Check if temp folder contains this file

  fs.readFile(iris.sitePath + '/temp/' + value, function (err, data) {

    if (!err) {

      fs.rename(iris.sitePath + '/temp/' + value, iris.sitePath + '/files/' + value, function () {

        thisHook.finish(true, "/files/" + value);

      });

    } else {

      iris.log("error", err);

      thisHook.finish(true, null);

    }

  });

});

iris.modules.entity.registerHook("hook_entity_field_fieldType_form__file", 0, function (thisHook, data) {

  var value = thisHook.const.value;
  var fieldSettings = thisHook.const.fieldSettings;

  data = {
    "type": "file",
    "title": fieldSettings.label,
    "description": fieldSettings.description,
    "default": value
  }

  thisHook.finish(true, data);

});

/*jshint nomen: true, node:true */
/* globals iris,mongoose,Promise,$,JSONForm,document,FormData,alert*/

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
  };

  mkdirSync(iris.sitePath + "/" + "temp");

  mkdirSync(iris.sitePath + "/" + "files");

  req.pipe(req.busboy);

  req.busboy.on('file', function (fieldname, file, filename) {

    // Set max size to 0 if not set

    if (!iris.config.max_file_size) {

      iris.config.max_file_size = 0;

    }

    var maxSize = iris.config.max_file_size * 1000000;

    var size = 0;

    var failed;

    var buffer = [];

    file.on('data', function (data) {

      size += data.length;

      buffer.push(data);

      if (size > maxSize) {

        failed = "File should be smaller than " + maxSize / 1000000 + "MB";
        file.resume();

      }

    });

    file.on("end", function () {

      if (failed) {
        res.status(400).send(failed);
        return false;
      }

      filename = filename.split(" ").join("_");

      var wstream = fs.createWriteStream(iris.sitePath + '/temp/' + filename);

      wstream.write(Buffer.concat(buffer));

      wstream.on("finish", function (data) {

        res.send(filename);

      });

      wstream.end();

    });

  });

});

iris.modules.auth.globals.registerPermission("Can upload files", "files");

// Register file field widget

iris.modules.forms.globals.registerWidget(function () {

  JSONForm.elementTypes.file = Object.create(JSONForm.elementTypes.text);

  JSONForm.elementTypes.file.template = '<span class="currentFile"><%= value ? "Current file: " + escape(value) : ""  %></span><input class="filefield" type="file" ' +
    '<%= (fieldHtmlClass ? "class=\'" + fieldHtmlClass + "\' " : "") %>' +
    'name="FILEFIELD<%= node.name %>" value="<%= escape(value) %>" id="FILEFIELD<%= id %>"' +
    '<%= (node.disabled? " disabled" : "")%>' +
    '<%= (node.readOnly ? " readonly=\'readonly\'" : "") %>' +
    '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
    '<%= (node.schemaElement && node.schemaElement.required && (node.schemaElement.type !== "boolean") ? " required=\'required\'" : "") %>' +
    '<%= (node.placeholder? "placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
    ' /><input style="display:none" id="<%= id %>" type="text" value="<%= escape(value) %>" name="<%= node.name %>" />';
  JSONForm.elementTypes.file.fieldTemplate = true;
  JSONForm.elementTypes.file.inputfield = true;

  $(document).on("change", "input.filefield", function (data) {

    var fileInput = data.target;
    var file = fileInput.files[0];
    var formData = new FormData();
    formData.append('file', file);

    var id = $(data.target).attr("id").replace("FILEFIELD", "");

    var parentForm = $(fileInput).closest("form")[0];

    // Get form parameters

    var params = $(parentForm).attr("data-params").split(",");

    var formID = $(parentForm).attr("id");

    id = id.substring(id.indexOf("elt-") + 4);

    $.ajax({
      url: '/admin/file/fileFieldUpload/' + id + "/" + formID + "/" + JSON.stringify(params),
      type: 'POST',
      data: formData,
      contentType: false,
      processData: false,
    }).done(function (response) {

      $(fileInput).parent().find(".currentFile").hide();

      $('input[name="' + id + '"]').attr("value", response);

    }).fail(function (error) {

      $('input[name="' + id + '"]').attr("value", null);
      $(fileInput).parent().find(".currentFile").hide();
      fileInput.value = null;
      alert(error.responseText);

    });

  });

}, "file");

// Field save handler

iris.modules.filefield.registerHook("hook_entity_field_fieldType_save__file", 0, function (thisHook, data) {

  var value = thisHook.context.value.split(" ").join("_");

  // Check if temp folder contains this file

  fs.readFile(iris.sitePath + '/temp/' + value, function (err, data) {

    if (!err) {

      fs.rename(iris.sitePath + '/temp/' + value, iris.sitePath + '/files/' + value, function () {

        thisHook.pass("/files/" + value);

      });

    } else {

      thisHook.pass(value);

    }

  });

});

iris.modules.entity.registerHook("hook_entity_field_fieldType_form__file", 0, function (thisHook, data) {

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  data = {
    "type": "file",
    "title": fieldSettings.label,
    "description": fieldSettings.description,
    "default": value
  };

  thisHook.pass(data);

});

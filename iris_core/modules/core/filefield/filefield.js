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

  // Make temp file directory if it doesn't exist

  var mkdirSync = function (path) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      if (e.code != 'EEXIST') throw e;
    }
  }

  mkdirSync(iris.sitePath + "/" + "temp");

  mkdirSync(iris.sitePath + "/" + "files");

  var fstream;


  iris.hook("hook_file_upload", req.authPass, {
    filename: req.params.filename,
    form: req.params.form,
    url: req.url,
    formParams: req.params.parameters
  }, {}).then(function (info) {

      if (!iris.config.max_file_size) {

        iris.config.max_file_size = 0;

      }

      var maxSize = iris.config.max_file_size * 1000000;

      if (info.maxSize) {

        maxSize = info.maxSize * 1000000;

      }

      req.pipe(req.busboy);

      req.busboy.on('file', function (fieldname, file, filename) {

        var failed = false;

        if (info.extensions) {

          var path = require('path')

          var ext = path.extname(filename).replace(".", "");

          if (info.extensions.indexOf(ext) === -1) {

            failed = "File extension has to be one of " + info.extensions.join(",");
            file.resume();

          }

        }

        var size = 0;

        // Get the size of the file being uploaded

        file.on('data', function (data) {

          if (size > maxSize) {

            failed = "File should be smaller than " + maxSize / 1000000 + "MB";
            file.resume();

          }

          size += data.length;

        });

        file.on('end', function () {

          if (failed) {

            res.send(failed);

            return false;

          }

          fstream = fs.createWriteStream(iris.sitePath + '/temp/' + filename);
          file.pipe(fstream);
          fstream.on('close', function () {

            res.end(filename);

          });

        });

      });

    },
    function (fail) {

      res.send(fail);

    });

});

iris.modules.auth.globals.registerPermission("Can upload files", "files");

/**
 * @member hook_file_upload
 * @memberof filefield
 *
 * @desc Uploads a file to the server after validating and checking user's permissions
 */
iris.modules.filefield.registerHook("hook_file_upload", 0, function (thisHook, data) {

  if (iris.modules.auth.globals.checkPermissions(["Can upload files"], thisHook.authPass)) {

    // If entity form, check if file small enough

    if (thisHook.const.form === "editEntity" || thisHook.const.form === "createEntity") {

      var entityType = JSON.parse(thisHook.const.formParams)[1];

      if (entityType) {

        var schema = schema = iris.dbCollections[entityType].schema.tree;

        // Check if file size set in schema

        var args = {};

        if (schema[thisHook.const.filename] && schema[thisHook.const.filename]["size"]) {

          args.maxSize = schema[thisHook.const.filename]["size"];

        }

        if (schema[thisHook.const.filename] && schema[thisHook.const.filename]["extensions"]) {

          args.extensions = schema[thisHook.const.filename]["extensions"].split(",");

        }

        thisHook.finish(true, args)

      }

    } else {

      thisHook.finish(true, data);

    }

  } else {

    thisHook.finish(false, "Not allowed to upload files");

  }

})

iris.modules.filefield.registerHook("hook_render_entityfield_form", 0, function (thisHook, data) {

  var name = thisHook.const.field.fieldTypeName;


  if (name === "file") {

    data = {
      type: "file",
      title: thisHook.const.field.title,
      required: thisHook.const.field.required,
      description: thisHook.const.field.description,
      default: thisHook.const.value
    }

  }

  thisHook.finish(true, data);

});

// Register file field widget

iris.modules.forms.globals.registerWidget(function () {

  JSONForm.elementTypes['file'] = Object.create(JSONForm.elementTypes['text']);

  JSONForm.elementTypes['file'].template = '<input class="filefield" type="file" ' +
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
        processData: false,
        contentType: false
      }).done(function (response) {

        alert(response);

        $("#" + id).attr("value", response);

      });

    });

  });

}, "file");

// Field save handler

iris.modules.filefield.registerHook("hook_entityfield_save", 0, function (thisHook, data) {

  var fieldSchema = thisHook.const.schema,
    value = thisHook.const.value,
    fieldName = thisHook.const.schema.fieldTypeName,
    fieldType = iris.modules.entity2.globals.fieldTypes[thisHook.const.schema.fieldTypeName].fieldTypeType;


  if (fieldName === "file") {

    // Check if temp folder contains this file

    fs.readFile(iris.sitePath + '/temp/' + value, function (err, data) {

      if (!err) {

        fs.rename(iris.sitePath + '/temp/' + value, iris.sitePath + '/files/' + value, function () {

          thisHook.finish(true, thisHook.const.value);

        });

      } else {

        thisHook.finish(true, thisHook.const.value);

      }

    });

  } else {

    thisHook.finish(true, data);

  }

});

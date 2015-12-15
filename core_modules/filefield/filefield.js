C.registerModule("filefield");

var busboy = require('connect-busboy');

C.app.use(busboy());

var fs = require('fs');

C.app.post('/admin/file/fileFieldUpload/:filename/:form/:parameters', function (req, res) {

  // Make temp file directory if it doesn't exist

  var mkdirSync = function (path) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      if (e.code != 'EEXIST') throw e;
    }
  }

  mkdirSync(C.sitePath + "/" + "temp");

  mkdirSync(C.sitePath + "/" + "files");

  var fstream;


  C.hook("hook_file_upload", req.authPass, {
    filename: req.params.filename,
    form: req.params.form,
    url: req.url,
    formParams: req.params.parameters
  }, {}).then(function (info) {

      if (!C.config.max_file_size) {

        C.config.max_file_size = 0;

      }

      var maxSize = C.config.max_file_size * 1000000;

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

          fstream = fs.createWriteStream(C.sitePath + '/temp/' + filename);
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

CM.auth.globals.registerPermission("Can upload files", "files");

CM.filefield.registerHook("hook_file_upload", 0, function (thisHook, data) {

  if (CM.auth.globals.checkPermissions(["Can upload files"], thisHook.authPass)) {

    // If entity form, check if file small enough

    if (thisHook.const.form === "editEntity" || thisHook.const.form === "createEntity") {

      var entityType = JSON.parse(thisHook.const.formParams)[1];

      if (entityType) {

        var schema = schema = C.dbCollections[entityType].schema.tree;

        // Check if file size set in schema

        var arguments = {};

        if (schema[thisHook.const.filename] && schema[thisHook.const.filename]["size"]) {

          arguments.maxSize = schema[thisHook.const.filename]["size"];

        }

        if (schema[thisHook.const.filename] && schema[thisHook.const.filename]["extensions"]) {

          arguments.extensions = schema[thisHook.const.filename]["extensions"].split(",");

        }

        thisHook.finish(true, arguments)

      }

    } else {

      thisHook.finish(true, data);

    }

  } else {

    thisHook.finish(false, "Not allowed to upload files");

  }

})

CM.filefield.registerHook("hook_render_entityfield_form", 0, function (thisHook, data) {

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

CM.forms.globals.registerWidget(function () {

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

CM.filefield.registerHook("hook_entityfield_save", 0, function (thisHook, data) {

  var fieldSchema = thisHook.const.schema,
    value = thisHook.const.value,
    fieldName = thisHook.const.schema.fieldTypeName,
    fieldType = CM.entity2.globals.fieldTypes[thisHook.const.schema.fieldTypeName].fieldTypeType;


  if (fieldName === "file") {

    // Check if temp folder contains this file

    fs.readFile(C.sitePath + '/temp/' + value, function (err, data) {

      if (!err) {

        fs.rename(C.sitePath + '/temp/' + value, C.sitePath + '/files/' + value, function () {

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

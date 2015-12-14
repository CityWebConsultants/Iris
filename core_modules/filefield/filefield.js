C.registerModule("filefield");

var busboy = require('connect-busboy');

C.app.use(busboy());

var fs = require('fs');

C.app.post('/admin/file/fileFieldUpload/:filename/:form', function (req, res) {

  // Make temp file directory if it doesn't exist

  var mkdirSync = function (path) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      if (e.code != 'EEXIST') throw e;
    }
  }

  mkdirSync(C.sitePath + "/" + "temp");

  var fstream;


  C.hook("hook_file_upload", req.authPass, {
    filename: req.params.filename,
    form: req.params.form
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

      var size = 0;

      // Get the size of the file being uploaded

      file.on('data', function (data) {

        if (size > maxSize) {

          file.resume();
          failed = true;

        }

        size += data.length;

      });

      file.on('end', function () {

        if (failed) {

          res.send("File should be smaller than " + maxSize / 1000000 + "MB");

          return false;

        }

        fstream = fs.createWriteStream(C.sitePath + '/temp/' + filename);
        file.pipe(fstream);
        fstream.on('close', function () {

          res.end(filename);

        });

      });

    });

  }, function (fail) {

    res.send(fail);

  });

});

CM.auth.globals.registerPermission("Can upload files", "files");

CM.filefield.registerHook("hook_file_upload", 0, function (thisHook, data) {

  if (CM.auth.globals.checkPermissions(["Can upload files"], thisHook.authPass)) {

    thisHook.finish(true, data);

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

      var formID = $(fileInput).closest("form")[0];

      formID = $(formID).attr("id");

      $.ajax({
        url: '/admin/file/fileFieldUpload/' + id + "/" + formID,
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

CM.entity2.registerHook("hook_entityfield_save", 0, function (thisHook, data) {

  var fieldSchema = thisHook.const.schema,
    value = thisHook.const.value,
    fieldName = thisHook.const.schema.fieldTypeName,
    fieldType = CM.entity2.globals.fieldTypes[thisHook.const.schema.fieldTypeName].fieldTypeType;

  if (fieldType === "string") {

    thisHook.finish(true, thisHook.const.value)

  } else if (fieldType === "ofstring") {

    thisHook.finish(true, thisHook.const.value)

  } else {

    thisHook.finish(false, data);

  }

});

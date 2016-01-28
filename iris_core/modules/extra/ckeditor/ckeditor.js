// Check if a form contains a CKeditor field, if yes, add a special class

iris.modules.ckeditor.registerHook("hook_form_render", 1, function (thisHook, form) {

  thisHook.finish(true, form);

});

// Add ckeditor to longstring field

iris.modules.ckeditor.registerHook("hook_render_entityfield_form", 0, function (thisHook, data) {

  var name = thisHook.const.field.fieldTypeName;

  if (name === "longstring") {

    data = {
      "type": "ckeditor",
      "title": thisHook.const.field.label || thisHook.const.field.label,
      "required": thisHook.const.field.required,
      "description": thisHook.const.field.description,
      "default": thisHook.const.value
    }

    thisHook.finish(true, data);

  } else {

    thisHook.finish(true, data);

  }

});

// Register CKeditor widget

iris.modules.forms.globals.registerWidget(function () {

  JSONForm.elementTypes['ckeditor'] = Object.create(JSONForm.elementTypes['text']);

  $(document).ready(function () {

    $.getScript("//cdn.ckeditor.com/4.5.3/standard/ckeditor.js", function () {

      $(".ckeditor").each(function () {
        CKEDITOR.replace(this, {

          customConfig: '/modules/ckeditor/config.js'

        });
      });

      CKEDITOR.on("instanceReady", function () {

        for (var i in CKEDITOR.instances) {

          var parent = $(CKEDITOR.instances[i].element.$);

          parent.attr("required", parent.attr("data-required"));

          CKEDITOR.instances[i].on('change', function (e) {

            var data = e.editor.getData();

            $(e.editor.element)[0].$.innerHTML = data;

          });

        };

      })

    });

  });

  JSONForm.requiredFlip = function (required) {

    if (required) {

      return 'data-required="required"';

    }

  }

  JSONForm.elementTypes['ckeditor'].template = '<textarea class="ckeditor" id="<%= id %>" name="<%= node.name %>" <%= JSONForm.requiredFlip(node.required) %> ><%= value %></textarea>';
  JSONForm.elementTypes['ckeditor'].fieldTemplate = true;
  JSONForm.elementTypes['ckeditor'].inputfield = true;

}, "CKeditor");

// CKeditor file upload field

var fs = require('fs');

iris.app.post('/admin/file/ckeditorupload', function (req, res) {

  var mkdirSync = function (path) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      if (e.code != 'EEXIST') throw e;
    }
  }

  mkdirSync(iris.sitePath + "/" + "files");

  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {

    fstream = fs.createWriteStream(iris.sitePath + '/files/' + filename);
    file.pipe(fstream);
    fstream.on('close', function () {

      res.end("<script>window.parent.CKEDITOR.tools.callFunction('" + req.query.CKEditorFuncNum + "','/files/" + filename + "','Uploaded!');</script>");

    });
  });

});

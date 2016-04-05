// Add ckeditor to longstring field

// Register CKeditor widget

iris.modules.entityUI.globals.registerFieldWidget("Longtext", "CKeditor field");

// Long string field hook

iris.modules.ckeditor.registerHook("hook_entity_field_widget_form__ckeditor_field", 2, function (thisHook, data) {

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  data = {
    "type": "ckeditor",
    title: fieldSettings.label,
    "description": fieldSettings.description,
    "default": value
  }

  thisHook.pass(data);

});

// Register CKeditor JSONform widget

iris.modules.forms.globals.registerWidget(function () {

  JSONForm.elementTypes['ckeditor'] = Object.create(JSONForm.elementTypes['text']);

  document.addEventListener('formsLoaded', function (e) {

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

  }, false);

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

/*
 * Add to custom blocks form
 */

iris.modules.ckeditor.registerHook("hook_form_render__blockForm_Custom-HTML", 1, function (thisHook, data) {

  data.schema.contents.type = "ckeditor";

  thisHook.pass(data);

});

C.registerModule("ckeditor");

// Check if a form contains a CKeditor field, if yes, add a special class

CM.ckeditor.registerHook("hook_form_render", 1, function (thisHook, form) {

  thisHook.finish(true, form);

});

var sanitizeHtml = require('sanitize-html');

CM.ckeditor.registerHook("hook_entity_presave", 0, function (thisHook, data) {

  var schema = C.dbCollections[data.entityType].schema.tree;

  Object.keys(data).forEach(function (field) {

    if (schema[field] && schema[field].allowedTags) {

      var tags = schema[field].allowedTags;

      data[field] = sanitizeHtml(data[field], {
        allowedTags: tags,
        allowedAttributes: {
            '*': ['href', 'align', 'alt', 'center', 'bgcolor', 'class', 'id']
        }
      });

    }

  });

  thisHook.finish(true, data);

});

CM.ckeditor.registerHook("hook_render_entityfield_form", 0, function (thisHook, data) {

  var name = thisHook.const.field.fieldTypeName;

  if (name === "longstring") {

    data = {
      "type": "ckeditor",
      "title": thisHook.const.field.title,
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

CM.forms.globals.registerWidget(function () {

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

          CKEDITOR.instances[i].on('change', function (e) {

            var data = e.editor.getData();

            $(e.editor.element)[0].$.innerHTML = data;

          });

        };

      })

    });

  });

  JSONForm.elementTypes['ckeditor'].template = '<textarea class="ckeditor" id="<%= id %>" name="<%= node.name %>" ' +
    'style="height:<%= elt.height || "150px" %>;width:<%= elt.width || "100%" %>;"' +
    '<%= (node.disabled? " disabled" : "")%>' +
    '<%= (node.readOnly ? " readonly=\'readonly\'" : "") %>' +
    '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
    '<%= (node.schemaElement && node.schemaElement.required ? " required=\'required\'" : "") %>' +
    '<%= (node.placeholder? "placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
    '><%= value %></textarea>';
  JSONForm.elementTypes['ckeditor'].fieldTemplate = true;
  JSONForm.elementTypes['ckeditor'].inputfield = true;

}, "CKeditor");

// CKeditor file upload field

var fs = require('fs');

C.app.post('/admin/file/ckeditorupload', function (req, res) {

  var mkdirSync = function (path) {
    try {
      fs.mkdirSync(path);
    } catch (e) {
      if (e.code != 'EEXIST') throw e;
    }
  }

  mkdirSync(C.sitePath + "/" + "files");

  var fstream;
  req.pipe(req.busboy);
  req.busboy.on('file', function (fieldname, file, filename) {

    fstream = fs.createWriteStream(C.sitePath + '/files/' + filename);
    file.pipe(fstream);
    fstream.on('close', function () {

      res.end("<script>window.parent.CKEDITOR.tools.callFunction('" + req.query.CKEditorFuncNum + "','/files/" + filename + "','Uploaded!');</script>");

    });
  });

});

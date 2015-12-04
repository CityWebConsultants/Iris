C.registerModule("filefield");

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
    'name="<%= node.name %>" value="<%= escape(value) %>" id="<%= id %>"' +
    '<%= (node.disabled? " disabled" : "")%>' +
    '<%= (node.readOnly ? " readonly=\'readonly\'" : "") %>' +
    '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
    '<%= (node.schemaElement && node.schemaElement.required && (node.schemaElement.type !== "boolean") ? " required=\'required\'" : "") %>' +
    '<%= (node.placeholder? "placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
    ' />',
    JSONForm.elementTypes['file'].fieldTemplate = true;
  JSONForm.elementTypes['file'].inputfield = true;

  $(document).ready(function () {

    $("input.filefield").on("change", function (data) {

      var fileInput = data.target;
      var file = fileInput.files[0];
      var formData = new FormData();
      formData.append('file', file);

      $.ajax({
        url: '/admin/file/fileFieldUpload',
        type: 'POST',
        data: formData,
        processData: false,
        contentType: false
      }).done(function (response) {

        $(data.target).attr("value", response).attr("type", "text");

      });

    });

  });

}, "file");

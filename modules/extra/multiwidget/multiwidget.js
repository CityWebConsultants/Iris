

iris.modules.entityUI.globals.registerFieldWidget("Longtext", "multiwidget field");
iris.modules.entityUI.globals.registerFieldWidget("Longtexts", "editorwidget field");

iris.modules.multiwidget.registerHook("hook_entity_field_fieldType_form__longtexts", 0, function (thisHook, data) {

  var value = thisHook.context.value;
  
  var fieldSettings = thisHook.context.fieldSettings;

  data = {
    "type": "array",
    "title": fieldSettings.label,
    "description": fieldSettings.description,
    "default": value,
    "items": {
      "type": "object",
      "properties": {
        "content": {
          "type": "textarea",
          "title": thisHook.authPass.t("Content")
        },
        "widget": {
          "type": "select",
          "title": thisHook.authPass.t("Widget Option")
        },
        "filter": {
          "type": "select",
          "title": thisHook.authPass.t("Filter Option")
        }
      }
    }
  };

  thisHook.pass(data);
});

iris.modules.multiwidget.registerHook("hook_entity_field_widget_form__editorwidget_field", 2, function (thisHook, data) {

  var value = thisHook.context.value;
  
  var fieldSettings = thisHook.context.fieldSettings;

  data = {
    "type": "editorwidget",
    title: fieldSettings.label,
    "description": fieldSettings.description,
    "default": value,
    "items": {
      "type": "object",
      "properties": {
        "content": {
          "type": "textarea",
          "title": thisHook.authPass.t("Content")
        },
        "widget": {
          "type": "select",
          "title": thisHook.authPass.t("Widget Option"),
          "enum": ["--", "ace", "ckeditor"]
        },
        "filter": {
          "type": "select",
          "title": thisHook.authPass.t("Filter Option"),
          "enum": ["--", "Partial HTML", "Full HTML"]
        }
      }
    }
  }

  thisHook.pass(data);

});


iris.modules.multiwidget.registerHook("hook_entity_field_widget_form__multiwidget_field", 2, function (thisHook, data) {

  var value = thisHook.context.value;
  var fieldSettings = thisHook.context.fieldSettings;

  data = {
    "type": "multiwidget",
    title: fieldSettings.label,
    "description": fieldSettings.description,
    "default": value
  }

  thisHook.pass(data);

});

iris.modules.forms.globals.registerWidget(function () {


  JSONForm.elementTypes['editorwidget'] = JSONForm.elementTypes['array'];

  var fnonInsert = JSONForm.elementTypes['editorwidget'].onInsert;

  JSONForm.elementTypes['editorwidget'].onInsert = function (evt, node) {

    var ckeditor, aceeditor, widgetFunction;
    
      var getCKEditor = function(cb){
        if(!ckeditor){
          $.getScript("//cdn.ckeditor.com/4.5.3/standard/ckeditor.js", function () {
            ckeditor = CKEDITOR;
            cb(null,ckeditor);
          });
        }
        else{
          cb(null,aceeditor);
        }
      };
      
      var getAceEditor = function(cb){
        
        if(!aceeditor){
          $.getScript("//cdnjs.cloudflare.com/ajax/libs/ace/1.2.3/ace.js", function () {
            aceeditor = ace;
            cb(null,aceeditor);
          });
        }
        else{
          cb(null,aceeditor);
        }

      };
      
    document.addEventListener('formsLoaded', function (e) {
      
      var convertToCKEditor = function (elem, textarea) {
        getCKEditor(function(err,ckeditor){
          if (ckeditor && !ckeditor.instances[$(elem).attr("id")]) {
            $(elem).each(function () {
              ckeditor.replace(this, {
  
                customConfig: '/modules/ckeditor/config.js'
  
              });
              ckeditor.instances[$(elem).attr("id")].on('change', function (e) {
  
                var data = e.editor.getData();
  
                textarea.val(data);
  
              });
            });
          }
        });
        

      }

      var removeCKEditor = function (elem) {
        if (ckeditor && ckeditor.instances[$(elem).attr("id")]) {
          ckeditor.instances[$(elem).attr("id")].destroy(true);
        }
      };

      var convertToAceEditor = function (elem, textarea) {
        getAceEditor(function(err,aceeditor){
          var editor = aceeditor.edit(elem.attr("id"));
          editor.setTheme("ace/theme/monokai");
          editor.resize();
          editor.getSession().setMode("ace/mode/javascript");
          editor.getSession().setValue(textarea.val());
          editor.getSession().on('change', function () {
            textarea.val(editor.getSession().getValue());
          });
          return editor;
        });
        

      };

      var removeAceEditor = function (editor) {
        if (editor) {
          aceeditor.edit(editor).destroy();
        }
      }


      var editor = null;

     
      widgetFunction = function () {

        var widgetOption = $(this);
        var textarea = $('textarea[name="' + $(this).attr("name").replace(".widget", ".content") + '"]');
        var diveditor = $('div[id="div-' + textarea.attr("id") + '"]');
        console.log(diveditor.length);
        if (!diveditor.length) {
          diveditor = $(document.createElement('div'));
          diveditor.attr("id", "div-" + textarea.attr("id"));
          diveditor.css("height", "300px");
        }
        console.log(diveditor.length);
        textarea.parent().append(diveditor);

        if (widgetOption.val() == "--") {
          removeAceEditor(editor)
          removeCKEditor(diveditor);
          diveditor.css("display", "none");
          textarea.css("display", "block");
        }

        if (widgetOption.val() == "ace") {
          removeCKEditor(diveditor);
          diveditor.css("display", "block");
          textarea.css("display", "none");
          convertToAceEditor(diveditor, textarea);
        }

        if (widgetOption.val() == "ckeditor") {
          removeAceEditor(editor);
          diveditor.css("display", "block");
          textarea.css("display", "none");
          convertToCKEditor(diveditor, textarea);
        }


      };
      
      $('select[name$=".widget"]').change(widgetFunction);
      $('select[name$=".widget"]').change();


    });

    fnonInsert(evt, node);
    
    $("._jsonform-array-addmore").click(function(){
        $('select[name$=".widget"]').each(function(index){
          $( this ).change(widgetFunction);
          $( this ).change();
        });
      });
  };




  JSONForm.elementTypes['multiwidget'] = JSON.parse(JSON.stringify(JSONForm.elementTypes['textarea']));

  JSONForm.elementTypes['multiwidget'].template
    = '<textarea id="<%= id %>" name="<%= node.name %>" ' +
    'class="<%= fieldHtmlClass || cls.textualInputClass %>" ' +
    'style="<%= elt.height ? "height:" + elt.height + ";" : "" %>width:<%= elt.width || "100%" %>;"' +
    '<%= (node.disabled? " disabled" : "")%>' +
    '<%= (node.isReadOnly() ? " readonly=\'readonly\'" : "") %>' +
    '<%= (node.schemaElement && node.schemaElement.maxLength ? " maxlength=\'" + node.schemaElement.maxLength + "\'" : "") %>' +
    '<%= (node.required ? " required=\'required\'" : "") %>' +
    '<%= (node.placeholder? " placeholder=" + \'"\' + escape(node.placeholder) + \'"\' : "")%>' +
    ' ><%= value %></textarea><div id="div-<%= id %>" name="div-<%= id %>" style="height: 300px"><%= value %></div>' +


    '<label>Choose widget</label>' +
    '<select id="<%= id %>-widget-option" name="<%= node.name %>-widget-option">' +
    '<option value="none">--</option>' +
    '<option value="ckeditor">CKeditor</option>' +
    '<option value="ace">Ace</option></select>';

  JSONForm.elementTypes['multiwidget'].onInsert = function (evt, node) {

    var ckeditor, aceeditor;
    document.addEventListener('formsLoaded', function (e) {

      $.getScript("//cdn.ckeditor.com/4.5.3/standard/ckeditor.js", function () {
        ckeditor = CKEDITOR;
      });

      $.getScript("//cdnjs.cloudflare.com/ajax/libs/ace/1.2.3/ace.js", function () {
        aceeditor = ace;

      });
      var convertToCKEditor = function (elem, textarea) {

        if (ckeditor && !ckeditor.instances[$(elem).attr("id")]) {
          $(elem).each(function () {
            ckeditor.replace(this, {

              customConfig: '/modules/ckeditor/config.js'

            });
            ckeditor.instances[$(elem).attr("id")].on('change', function (e) {

              var data = e.editor.getData();

              textarea.val(data);

            });
          });
        }

      }

      var removeCKEditor = function (elem) {
        if (ckeditor && ckeditor.instances[$(elem).attr("id")]) {
          ckeditor.instances[$(elem).attr("id")].destroy(true);
        }
      };

      var convertToAceEditor = function (elem, textarea) {

        var editor = aceeditor.edit(elem.attr("id"));
        editor.setTheme("ace/theme/monokai");
        editor.resize();
        editor.getSession().setMode("ace/mode/javascript");
        editor.getSession().setValue(textarea.val());
        editor.getSession().on('change', function () {
          textarea.val(editor.getSession().getValue());
        });
        return editor;

      };

      var removeAceEditor = function (editor) {
        aceeditor.edit(editor).destroy();
      }


      var editor = null;
      $('select[name="' + node.name + '-widget-option"]').change(function () {

        var widgetOption = $(this).val();
        var textarea = $('textarea[id="' + node.id + '"]');
        var elemdiv = $('div[name="div-' + node.id + '"]');
        if (widgetOption == "ckeditor") {

          if (editor) {
            removeAceEditor();
          }
          convertToCKEditor(elemdiv, textarea);
          textarea.css("display", "none");
          elemdiv.css("display", "block");
        }
        else if (widgetOption == "ace") {
          removeCKEditor(elemdiv);
          editor = convertToAceEditor(elemdiv, textarea);
          textarea.css("display", "none");
          elemdiv.css("display", "block");

        }
        else {
          if (editor) {
            removeAceEditor(editor);
          }
          removeCKEditor(elemdiv);

          elemdiv.css("display", "none");
          textarea.css("display", "block");
        }

      });

      $('select[name="' + node.name + '-widget-option"]').change();
      
      

    });

  };
});
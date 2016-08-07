
iris.modules.entityUI.globals.registerFieldWidget("Longtexts", "editorwidget field");

iris.modules.multiwidget.registerHook("hook_entity_field_fieldType_form__longtexts", 0, function (thisHook, data) {

  var value = thisHook.context.value;
  
  var fieldSettings = thisHook.context.fieldSettings;

  var fs = require("fs");

  var filters = [];
  var savedFilters = fs.readdirSync(iris.configPath + "/textfilters");
  
  savedFilters.map(function (filter) {

    filters.push(filter.replace(".json", ""));

  });
  
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
        }
      }
    }
  };
  
  if(filters.length){
    data.items.properties.filter = {
          "type": "select",
          "title": thisHook.authPass.t("Filter Option"),
           "enum": ["none"].concat(filters)
        };
  }

  thisHook.pass(data);
});

iris.modules.multiwidget.registerHook("hook_entity_field_widget_form__editorwidget_field", 2, function (thisHook, data) {

  var value = thisHook.context.value;
  
  var fieldSettings = thisHook.context.fieldSettings;
  
  var fs = require("fs");

  var filters = [];
  var savedFilters = fs.readdirSync(iris.configPath + "/textfilters");
  
  savedFilters.map(function (filter) {

    filters.push(filter.replace(".json", ""));

  });
  
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
        }
      }
    }
  };
  
  if(filters.length){
    data.items.properties.filter = {
          "type": "select",
          "title": thisHook.authPass.t("Filter Option"),
           "enum": ["none"].concat(filters)
        };
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
          if (ckeditor && ckeditor.instances && !ckeditor.instances[$(elem).attr("id")]) {
            $(elem).each(function () {
              ckeditor.replace(this, {
  
                customConfig: '/modules/ckeditor/config.js'
  
              });
              ckeditor.instances[$(elem).attr("id")].setData(textarea.val());
              ckeditor.instances[$(elem).attr("id")].on('change', function (e) {
  
                var data = e.editor.getData();
  
                textarea.val(data);
  
              });
            });
          }
        });
        

      };

      var removeCKEditor = function (elem) {
        if (ckeditor && ckeditor.instances && ckeditor.instances[$(elem).attr("id")]) {
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
      };


      var editor = null;

     
      widgetFunction = function () {

        var widgetOption = $(this);
        var textarea = $('textarea[name="' + $(this).attr("name").replace(".widget", ".content") + '"]');
        var diveditor = $('div[id="div-' + textarea.attr("id") + '"]');

        if (!diveditor.length) {
          diveditor = $(document.createElement('div'));
          diveditor.attr("id", "div-" + textarea.attr("id"));
          diveditor.css("height", "300px");
        }
        console.log(diveditor.length);
        textarea.parent().append(diveditor);

        if (widgetOption.val() == "--") {
          removeAceEditor(editor);
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
});


iris.modules.multiwidget.registerHook("hook_entity_view_field__longtexts", 0, function (thisHook, data) {

  if(data && data.length){

      data.forEach(function(item){
    
        var filterConfig = iris.readConfigSync("textfilters", item.filter);

        var sanitizeHtml = require('sanitize-html');
    
        item.content = sanitizeHtml(item.content, {
          allowedTags: filterConfig.elements.split(" ").join("").split(","),
          allowedAttributes: {
            "*": filterConfig.attributes.split(" ").join("").split(",")
          }
    
        });

      });

      thisHook.pass(data);
  }
  
  else{
    
    thisHook.pass(data);
    
  }


});
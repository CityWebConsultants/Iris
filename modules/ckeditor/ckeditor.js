C.registerModule("ckeditor");

// Check if a form contains a CKeditor field, if yes, add a special class

CM.ckeditor.registerHook("hook_form_render", 1, function (thisHook, form) {
  
  thisHook.finish(true, form);

});

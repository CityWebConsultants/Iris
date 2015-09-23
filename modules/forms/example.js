//Example form

//CM.forms.globals.makeForm("example", {
//  schema: {
//    name: {
//      type: 'string',
//      title: 'Name',
//      required: true
//    },
//    age: {
//      type: 'number',
//      title: 'Age'
//    }
//  }
//});
//
//CM.forms.registerHook("hook_form_render_example", 0, function (thisHook, data) {
//
//  data.config.schema["hello"] = {
//
//    type: "string",
//    title: "New",
//    required: false
//
//  }
//
//  thisHook.finish(true, data);
//
//})
//
//CM.forms.registerHook("hook_form_submit_example", 0, function (thisHook, data) {
//
//  console.log(thisHook.const.params);
//
//  thisHook.finish(true, "/docs");
//
//});

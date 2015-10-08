// Login form

CM.forms.globals.makeForm("adminlogin", {
  username: {
    type: 'string',
    title: 'Username',
    required: true,
  },
  password: {
    type: 'password',
    title: 'Password'
  }
});

CM.admin_ui.registerHook("hook_form_submit_adminlogin", 0, function (thisHook, data) {

  console.log("Admin login");
  console.log(thisHook.const.params);

  thisHook.finish(true, "/action");

});

// Note - form preprocess

//CM.admin_ui.registerHook("hook_form_schema_alter_adminlogin", 0, function (thisHook, data) {
//
//  data.schema["hello"] = {
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

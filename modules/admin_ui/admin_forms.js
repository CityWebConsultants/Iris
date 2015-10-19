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

CM.admin_ui.registerHook("hook_form_submit", 0, function (thisHook, data) {

  if (thisHook.const.params.formid === "adminlogin") {

    console.log("Admin login");
    console.log(thisHook.const);

//    if (req.body.secretkey === C.config.secretkey && req.body.apikey === C.config.apikey) {
//
//      CM.admin.globals.adminToken = Math.random();
//
//      res.cookie('auth', CM.admin.globals.adminToken, {
//        //      maxAge: 200000
//      });
//
//      res.redirect("/admin");
//
//    } else {
//
//      res.redirect("/admin/login");
//
//    }

    thisHook.finish(true, "/action");

  } else {

    thisHook.finish(true, data);

  }

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

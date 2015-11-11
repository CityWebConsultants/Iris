CM.forms.registerHook("hook_form_render_apikey_login", 0, function (thisHook, data) {

  data = {
    "schema": {
      apikey: {
        type: 'password',
        title: 'API key',
        required: true,
      },
      secretkey: {
        type: 'password',
        title: 'Secret key',
        required: true,
      }
    }
  };

  thisHook.finish(true, data);

});


CM.admin_ui.globals.adminToken = [];

CM.admin_ui.registerHook("hook_form_submit_apikey_login", 0, function (thisHook, data) {

  var setLogin = function (res) {

    return new Promise(function (yes, no) {

      if (thisHook.const.params.secretkey === C.config.secretkey && thisHook.const.params.apikey === C.config.apikey) {

        var newToken = Math.random();

        CM.admin_ui.globals.adminToken.push(newToken.toString());

        res.cookie('admin_auth', newToken, {});

        yes();

      } else {

        yes()

      }

    });

  };

  thisHook.finish(true, setLogin);

});

CM.admin_ui.registerHook("hook_auth_authpass", 1, function (thisHook, data) {

  if (thisHook.req && thisHook.req.cookies && CM.admin_ui.globals.adminToken.indexOf(thisHook.req.cookies.admin_auth) !== -1) {

    data.roles.push("admin");

  }

  thisHook.finish(true, data);

});

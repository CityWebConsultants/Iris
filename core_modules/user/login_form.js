// Login form

CM.forms.registerHook("hook_form_render_login", 0, function (thisHook, data) {

  data = {
    "schema": {
      username: {
        type: 'string',
        title: 'Username',
        required: true,
      },
      password: {
        type: 'password',
        title: 'Password'
      }
    }
  };

  thisHook.finish(true, data);

});

CM.admin_ui.registerHook("hook_form_submit_login", 0, function (thisHook, data) {

  var setLogin = function (res) {

    return new Promise(function (yes, no) {

      CM.user.globals.login({
        username: thisHook.const.params.username,
        password: thisHook.const.params.password
      }, res, function (userid) {

        yes();

      });

    });

  };

  thisHook.finish(true, setLogin);

});

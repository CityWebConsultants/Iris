// Login form

CM.forms.globals.makeForm("login", {
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

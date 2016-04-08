// Login form

iris.modules.forms.registerHook("hook_form_render__login", 0, function (thisHook, data) {

  data.schema = {
    username: {
      type: 'string',
      title: 'Username/email',
      required: true,
    },
    password: {
      type: 'password',
      title: 'Password'
    },
    reset: {
      type: 'markup',
      markup : '<a href="/user/password">' + thisHook.authPass.t('Forgot your password?') + '</a>'
    }
  }

  data.form = [
    'username',
    'password',
    {
      type: 'submit',
      value: thisHook.authPass.t('Login')
    },
    'reset'
  ];

  thisHook.pass(data);

});

iris.modules.system.registerHook("hook_form_submit__login", 0, function (thisHook, data) {

  iris.modules.user.globals.login({
    username: thisHook.context.params.username,
    password: thisHook.context.params.password
  }, thisHook.context.res, function (userid) {

    if (!userid) {

      iris.message(thisHook.authPass.userid, "Wrong credentials", "danger");

    }

    thisHook.pass(data);

  });

});

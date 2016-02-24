// Login form

iris.modules.forms.registerHook("hook_form_render_login", 0, function (thisHook, data) {

  data.schema = {
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

  thisHook.finish(true, data);

});

iris.modules.system.registerHook("hook_form_submit_login", 0, function (thisHook, data) {

  iris.modules.user.globals.login({
    username: thisHook.const.params.username,
    password: thisHook.const.params.password
  }, thisHook.const.res, function (userid) {

    if (!userid) {

      iris.message(thisHook.authPass.userid, "Wrong credentials", "error");

    }

    data.messages.push("It works");
    thisHook.finish(true, data);

  });

});

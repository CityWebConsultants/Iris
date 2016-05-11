/*jshint nomen: true, node:true, sub:true */
/* globals iris,mongoose,Promise,$,window */

/**
 * @file General hooks and functions for the admin system.
 */

iris.registerModule("system");

require('./system_routing.js');

iris.modules.auth.globals.registerPermission("can view admin menu", "admin");

iris.modules.auth.globals.registerPermission("can access admin pages", "admin");

require('./system_modules.js');



iris.modules.system.registerHook("hook_form_render__restart", 0, function (thisHook, data) {

  data.onSubmit = function (errors, values) {

    //  $.post(window.location, values, function (data, err) {
    ////    window.location.href = window.location.href;
    //    console.log(values);
    //    console.log(window.location);
    //  });

  };

  data.form = [
    "*",
    {
      "type": "help",
      "helpvalue": "Click below to restart the server."
    },
    {
      "type": "submit",
      "id": "submit",
      "value": "Restart the server"
    }
  ];

  thisHook.pass(data);

});

iris.modules.system.registerHook("hook_form_submit__restart", 0, function (thisHook, data) {

  iris.restart(thisHook.authPass, {});

  thisHook.pass(data);

});


// Send messages to parent process on restart for persistence

iris.modules.system.registerHook("hook_restart_send", 0, function (thisHook, data) {

  data.messages = iris.messageStore;

  thisHook.pass(data);

})

iris.modules.system.registerHook("hook_restart_receive", 0, function (thisHook, data) {
    
  if (data.sessions) {

    Object.keys(data.sessions).forEach(function (user) {

      iris.modules.auth.globals.userList[user] = data.sessions[user];
      
      iris.modules.auth.globals.AttachAuthPass(iris.modules.auth.globals.userList[user],user);

    });

  }

  if (data.messages) {

    Object.keys(data.messages).forEach(function (user) {

      iris.messageStore[user] = data.messages[user];

    });

  }
  
  thisHook.pass(data);

})

// Placeholder hook TODO for sending socket message to update log page

iris.modules.system.registerHook("hook_log", 0, function (thisHook, data) {

  // Loop over users to see if they have the view log permission

  Object.keys(iris.modules.auth.globals.userList).forEach(function (user) {

    var token = Object.keys(iris.modules.auth.globals.userList[user].tokens)[0];

    iris.modules.auth.globals.credentialsToPass({
      userid: user,
      token: token
    }).then(function (authPass) {

      //      console.log(authPass);

    });

  });

  thisHook.pass(data);

});

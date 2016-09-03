iris.modules.frontend.registerHook("hook_frontend_embed__messages", 0, function (thisHook, data) {

  var messages = iris.readMessages(thisHook.authPass.userid);

  var output = "";

  if (messages.length) {

    output += "<ul class='iris-messages'>";

    messages.forEach(function (message) {

      output += "<li class='alert alert-" + message.type + "'>" + message.message + "</li >";

    });

    output += "</ul>";

    iris.clearMessages(thisHook.authPass.userid);


  }

  thisHook.pass(output);

})

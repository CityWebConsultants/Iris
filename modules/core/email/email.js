var nodemailer = require('nodemailer');
iris.registerModule("email");

/**
 * Define callback routes.
 */
var routes = {
  mail: {
    title: "Administer mail system",
    description: "Settings and configurations for email sending",
    permissions: ["can access admin pages"],
    menu: [{
      menuName: "admin_toolbar",
      parent: "/admin/config",
      title: "Mail system"
    }]
  }
}

/**
 * Admin page callback: mail settings admin page.
 *
 * This form allows modules to list their mailSystem handler that the user can select from.
 */
iris.route.get('/admin/config/mail-settings', routes.mail, function (req, res) {


  iris.modules.frontend.globals.parseTemplateFile(["mail-settings"], ['admin_wrapper'], {
    title : "Administer mail system"
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.email.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

});

  /**
   * Implements iris.modules.triggers.globals.registerAction().
   *
   * Registers an action that can be triggered by the system or directly. It describes
   * the form fields that are used in the execution of the action.
   *
   */
  if(iris.modules.triggers) {
    iris.modules.triggers.globals.registerAction("email", {
      "subject": {
        "type": "text",
        "title": "subject"
      },
      to: {
        "type": "text",
        "title": "Recipient address"
      },
      cc: {
        "type": "text",
        "title": "CC address"
      },
      from: {
        "type": "text",
        "title": "Sender address",
        "required": true,
      },
      message: {
        "type": "textarea",
        "title": "Message"
      }
    });
  }

  /**
   * Implements hook_triggers_[action_name].
   *
   * Hook that gets fired when the email action is triggered.
   */
iris.modules.email.registerHook("hook_triggers_email", 0, function (thisHook, data) {

    iris.modules.email.globals.sendEmail(thisHook.context);
    thisHook.pass(data);

});

  /**
   * Implements hook_form_render__[form_name].
   *
   * This form gets a list of mailSystem handlers from modules implementing hook_registerMailSystem.
   */

iris.modules.email.registerHook("hook_form_render__mailSettings", 0, function (thisHook, data) {
    
    var defaultSettings = {"mailSystem" : {}};
    iris.invokeHook("hook_registerMailSystem", thisHook.authPass, {}, defaultSettings).then(function(success){

        data.schema.mailSystem = {
            "type": "string",
            "title": thisHook.authPass.t("Choose mail system"),
            "enum": Object.keys(success.mailSystem)
        };
        
        data.form = [
        {
            "key": "mailSystem",
            "type": "select",
            "titleMap": success.mailSystem
        },
        {
          "type": "submit",
          "title": thisHook.authPass.t("Submit")
        }];
    

        thisHook.pass(data);

    }, function(fail){

        iris.log("error", fail);
        thisHook.fail(data);

    });
    
});

  /**
   * Implements hook_form_submit__[form_name].
   *
   * Saves the chosen mailSystem.
   *
   */
iris.modules.email.registerHook("hook_form_submit__mailSettings", 0, function (thisHook, data) {
    
    iris.saveConfig(thisHook.context.params, 'email', 'mail_system');
    
    iris.message(thisHook.authPass.userid, "Settings saved", "info");
    thisHook.pass(function (res) {
        res.send("/admin/config/mail-settings");

    });

});

 /**
   * Implements hook_registerMailSystem.
   *
   * Provides the 'Simple mail' option which will attempt to send emails directly from 
   * your system with no options.
   *
   */
iris.modules.email.registerHook("hook_registerMailSystem", 0, function(thisHook, data){

    data.mailSystem["email"] = "Simple mail";
    thisHook.pass(data);

});

 /**
   * Implements hook_sendMail.
   *
   * The sendMail hook is run everytime an email is triggered. This hook implements the
   * 'Simple mail' mailSystem and sends emails directly from the system.
   *
   */
iris.modules.email.registerHook("hook_sendMail", 0, function(thisHook, data){

    thisHook.context.sendMail({
        from: data.from,
        to: data.to,
        subject: data.subject,
        html: data.body
    }, function (err, response) {
        data.log = (err || response);
    });
    
    thisHook.pass(data);

});

 /**
   * Implements iris.modules.[module_name].globals.mailTransporter()
   *
   * Transporters are required for send emails via nodemailer. 
   *
   */
iris.modules.email.globals.mailTransporter = function() {
    
    return nodemailer.createTransport();
    
}


 /**
   * Function to send emails from Iris. This function can be called directly or triggered
   * by system actions.
   *
   * @param {object} args - An object of the basic required email fields such as 'to', 
   * 'from', 'subject', 'text'.
   * @param {object} authPass - The current authPass object.
   *
   */
iris.modules.email.globals.sendEmail = function(args, authPass) {
    
    iris.readConfig('email', 'mail_system').then(function (config) {

        if (typeof config.mailSystem == 'undefined') {
            config.mailSystem = 'email';
        }
        // Get selected mail system
        var transporter = iris.modules[config.mailSystem].globals.mailTransporter();
    
        iris.invokeHook("hook_sendMail", authPass, transporter, args).then(function(success){
            iris.log('notice', 'Email sent to: ', success.to);
            iris.message(authPass.userid, authPass.t("Email sent"), "info");
        }
        , function(fail){

            iris.log("error", fail);

        });


    }, function (fail) {

      // Add default if it doesn't exist.
      iris.saveConfig({email: 'Simple mail'}, 'email', 'mail_system');
      iris.modules.email.globals.sendEmail(args, authPass);

      iris.log("error", fail);

    });
    
}

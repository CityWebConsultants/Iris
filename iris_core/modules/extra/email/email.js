iris.registerModule("email");

var nodemailer = require('nodemailer');

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

// Ready for this or others to latch onto hook_triggers_email

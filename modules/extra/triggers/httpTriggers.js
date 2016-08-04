iris.modules.triggers.globals.registerAction("http_request", {

  host: {
    "type": "string",
    "title": "host (domain)",
    "required": true
  },
  path: {
    "type": "string",
    "title": "path"
  },
  port: {
    "type": "string",
    "title": "port"
  },
  method: {
    "type": "string",
    "title": "metod",
    "required": true,
    "enum": ["GET", "POST"]
  },
  "protocol": {
    "type": "string",
    "title": "metod",
    "required": true,
    "enum": ["http", "https"]
  },
  parameters: {
    "type": "array",
    "title": "parameters",
    items: {
      type: "object",
      properties: {
        "key": {
          type: "string",
          title: "key"
        },
        "value": {
          type: "string",
          title: "value"
        }
      }
    }
  }

});

var protocol = {};
protocol["http"] = require("http");
protocol["https"] = require("https");
var querystring = require("querystring");

iris.modules.triggers.registerHook("hook_triggers_http_request", 0, function (thisHook, data) {

  var params = thisHook.context.params;

  if (params.port) {

    params.port = parseInt(params.port);

  }

  var options = {

    host: params.host,
    path: params.path,
    port: params.port,
    method: params.method

  };

  // Change parameters to object

  if (params.parameters) {

    var prepared = {};

    params.parameters.forEach(function (parameter, index) {

      prepared[parameter.key] = parameter.value;

    });

    params.parameters = prepared;

  }
  
  var req;

  if (params.method === "POST") {

    data = querystring.stringify(params.parameters);

    options.headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Length': Buffer.byteLength(data)
    };

    req = protocol[params.protocol].request(options);

    req.write(data);
    req.end();

  } else {

    if (!options.path) {

      options.path = "";

    }

    var qs = querystring.stringify(params.parameters);

    options.path += "?" + qs;

    req = protocol[params.protocol].request(options, function (res) {

      // Do something with data response?

    });

    req.on('error', function (err) {

      iris.log("error", err);

    });

    req.end();

  }

  thisHook.pass(data);

});

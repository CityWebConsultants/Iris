var ncp = require('ncp').ncp;

C.app.get("/admin/api/config/export", function (req, res) {

  ncp(C.configPath, C.sitePath + "/staging", function (err) {
    if (err) {
      return console.error(err);
    }
    res.send("Config exported")
  });

});

C.app.get("/admin/api/config/import", function (req, res) {

  ncp(C.sitePath + "/staging", C.configPath, function (err) {
    if (err) {
      return console.error(err);
    }
    res.send("Config imported")
  });

});

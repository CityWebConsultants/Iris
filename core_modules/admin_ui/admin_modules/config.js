var ncp = require('ncp').ncp;

iris.app.get("/admin/api/config/export", function (req, res) {

  ncp(iris.configPath, iris.sitePath + "/staging", function (err) {
    if (err) {
      return console.error(err);
    }
    res.send("Config exported")
  });

});

iris.app.get("/admin/api/config/import", function (req, res) {

  ncp(iris.sitePath + "/staging", iris.configPath, function (err) {
    if (err) {
      return console.error(err);
    }
    res.send("Config imported")
  });

});

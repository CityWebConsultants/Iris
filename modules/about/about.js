var express = require('express');

iris.registerModule("about");

iris.app.use("/about", express.static(__dirname + '/static'));

iris.app.get("/about/readme.md", function (req, res) {

  res.sendFile(iris.rootPath + '/readme.md');

})

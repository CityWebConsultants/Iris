var express = require('express');

C.registerModule("about");

C.app.use("/about", express.static(__dirname + '/static'));

C.app.get("/about/readme.md", function (req, res) {

  res.sendFile(C.rootPath + '/readme.md');

})

C.registerModule("about");

var express = require('express');

//Register static directory

C.app.use(express.static(__dirname + '/static'));

require("./entityforms.js");

require("./permissions.js");

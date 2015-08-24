var express = require('express');

C.registerModule("about");

C.app.use("/about", express.static(__dirname + '/static'));

var express = require('express');
C.app.use("/admin2", express.static(__dirname + '/static'));

require('./admin_modules/permissions.js');

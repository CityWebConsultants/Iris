var express = require('express');
C.app.use("/admin", express.static(__dirname + '/static'));

require('./admin_modules/regions.js');
require('./admin_modules/permissions.js');
require('./admin_modules/entities.js');

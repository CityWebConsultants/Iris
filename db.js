var mongoose = require('mongoose');
mongoose.connect('mongodb://'+process.config.db_server+':'+process.config.db_port+'/'+process.config.db_name);
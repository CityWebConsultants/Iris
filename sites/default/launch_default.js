var config = {

  // Server

  port: 3000,

  // CMS integration
  apikey: 'letmein',
  secretkey: 'letmein',

  // HTTPS
  https: false,
  https_key: '/var/www/ssl/hub.wlmg.co.uk.key',
  https_cert: '/var/www/ssl/hub_combined.crt',

  // Database
  db_server: 'localhost',
  db_port: 27017,
  db_name: 'chat-app',

};

var server = require('../../boot')(config);

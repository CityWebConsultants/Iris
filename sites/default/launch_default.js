/*jslint nomen: true, node:true */
"use strict";

var config = {

  // Server

  configurations_path: "/configurations",
  port: 3000,

  // CMS integration
  admin_name: 'Site administrator',
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

  //Auth

  authTokenLength: 16,

};

var server = require('../../boot')(config);

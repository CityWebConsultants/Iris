/*jslint nomen: true, node:true */
"use strict";

var config = {

  // Server

  boot_location: "../../boot",
  port: 3000,
  peerport: 3001,

  // CMS integration
  admin_name: 'Site administrator',
  apikey: 'letmein',
  secretkey: 'letmein',

  // HTTPS
  https: false,
  https_key: '/var/www/ssl/hub.wlmg.co.uk.key',
  https_cert: '/var/www/ssl/hub_combined.crt',

  //Location of roles file

  roles: require('./roles.js'),

  // Database
  db_server: 'localhost',
  db_port: 27017,
  db_name: 'chat-app',

  //Auth

  authTokenLength: 16,

  // Enabled modules and per-module settings
  modules: [

    {
      name: 'group_manager',
      path: 'modules',
      enabled: true

    },

  ]

};

var server = require(config.boot_location)(config);

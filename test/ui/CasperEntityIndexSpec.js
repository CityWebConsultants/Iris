
var config = require('../test_config');
var util = require('../util/schema');

casper.test.begin('Test if schema are properly indexed', 1, function(test) {
  casper.start();
  var login = {
    'input[name = "username"]': config.adminUser.login.username,
    'input[name = "password"]': config.adminUser.login.password
  }
  util.test.login(login, 'input[name="username"]',function(){});
  casper.waitForText("This is the Iris administration area", function() {
    var data = {
      'input[name = "fields.unique"]': true,
      'input[name = "fields.required"]': true
    };
    util.test.updateSchemaField("user", data, 'input[name = "fields.unique"]',function(){});
  });
  casper.waitForText("Manage fields for user", function() {
    var data = {
      'input[name = username]': config.adminUser.login.username,
      'input[name = password]': 'poo'
    };
    util.test.createEntity("user", data, 'input[name = username]',function(){
      test.assertExists('form[data-formid="entity"]', "entity form not submitted");
    });

  });

  casper.run(function() {    
    test.done();
  })
})


var config = require('../test_config');
var util = require('../util/schema');

casper.test.begin('Test if schema are properly indexed', 2, function(test) {
  casper.start();
  var login = {
    'input[name = "username"]': config.adminUser.login.username,
    'input[name = "password"]': config.adminUser.login.password
  }
  util.test.login(login, 'input[name="username"]', function() { });
  casper.waitForText("This is the Iris administration area", function() {
    var data = {
      'input[name = "fields.unique"]': true,
      'input[name = "fields.required"]': true
    };
    util.test.updateSchemaField("page", "title", data, 'input[name = "fields.unique"]', function() { });
  });
  casper.waitForText("Field title saved on entity page", function() {
    var data = {
      'input[name = "title"]': "test title 1",
      'textarea[name = "body"]': 'test body 1'
    };
    util.test.createEntity("page", data, 'input[name = "title"]', function() {

      test.assertExists('form[data-formid="entity"]', "entity form not submitted");
      test.assertEquals(casper.getCurrentUrl(), 'http://www.iris.local:4000/page/create');
      
    });

  });

  casper.run(function() {
    test.done();
  })
})

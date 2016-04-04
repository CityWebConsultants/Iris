
var config = require('../test_config');
var fs = require('fs'), cookies;
casper.test.begin('Test if schema are properly indexed', 3, function(test) {
  casper.start("http://localhost:4000/admin", function() {
    test.assertExists('form[data-formid="login"]', "login form is found");
    casper.waitForSelector("form input[name='username']", function() {
      this.fillSelectors('form[data-formid="login"]', {
        'input[name = username]': config.adminUser.login.username,
        'input[name = password]': config.adminUser.login.password
      }, true);
    });
    casper.waitForText("This is the Iris administration area", function() {
      casper.thenOpen("http://localhost:4000/admin/schema/user/username", function() {
        test.assertExists('form[data-formid="schemafield"]', "schemafield form is found");
        casper.waitForSelector('input[name = "fields.unique"]', function() {
          this.fillSelectors('form[data-formid="schemafield"]', {
            'input[name = "fields.unique"]': true,
            'input[name = "fields.required"]': true
          }, true);
        });
      });
    });
    casper.waitForText("Manage fields for user", function() {
      casper.thenOpen("http://localhost:4000/admin/create/user", function() {
        test.assertExists('form[data-formid="entity"]', "entity form is found");
        casper.waitForSelector('input[name = username]', function() {
          this.fillSelectors('form[data-formid="entity"]', {
            'input[name = username]': config.adminUser.login.username,
            'input[name = password]': 'poo'
          }, true);

        });
      });
    });

  });

  casper.run(function() {
    test.done();
  })
})

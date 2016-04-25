
var config = require('../test_config');
var util = require('../util/schema');

casper.test.begin('Test if schema are properly indexed', 4, function(test) {
  casper.start();
  /**
   * Login as admin
   */
  var options = {
    url: config.baseURL + "/admin",
    waitFor: 'input[name="username"]',
    formId: 'form[data-formid="login"]',
    data: {
      'input[name = "username"]': config.adminUser.login.username,
      'input[name = "password"]': config.adminUser.login.password
    }
  };
  util.test.openTransaction(options, function (err, result) {
    if (err) {
      console.log(err);
    }
    else {
      console.log("login success");
      test.assertEquals(casper.getCurrentUrl(), 'http://www.iris.local:4000/admin');
    }
  });
  casper.waitForText("This is the Iris administration area", function() {
   /**
    * Mage schema field title unique
    */
    var options = {
      url: config.baseURL + "/admin/schema/page/fields/title",
      waitFor: 'input[name="fields.unique"]',
      formId: 'form[data-formid="schemafield"]',
      data: {
        'input[name = "fields.unique"]': true,
        'input[name = "fields.required"]': true
      }
    };
    util.test.openTransaction(options, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("edit schema field page success");
        test.assertEquals(casper.getCurrentUrl(), 'http://www.iris.local:4000/admin/schema/page/fields/title');
      }
    });
    
  });
  casper.waitForText("Field title saved on entity page", function() {
    
   /**
    * Create record for entity page with existing title
    */
    var options = {
      url: config.baseURL + "/page/create",
      waitFor: 'input[name="title"]',
      formId: 'form[data-formid="entity"]',
      data: {
         'input[name = "title"]': "test title 1",
         'textarea[name = "body"]': 'test body 1'
      }
    };
    util.test.openTransaction(options, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        test.assertExists('form[data-formid="entity"]', "entity form not submitted");
        test.assertEquals(casper.getCurrentUrl(), 'http://www.iris.local:4000/page/create');
      }
    });

  });
   /**
   * Wait for delete schema field redirect
   */
  casper.waitForText("Create new page", function () {
    /**
    * logout
    */
    util.test.logout(function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("logout out user for next test ");
      }
    });
  });

  casper.run(function() {
    test.done();
  })
})

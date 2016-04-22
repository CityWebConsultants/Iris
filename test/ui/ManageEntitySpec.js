
var config = require('../test_config');
var util = require('../util/schema');
var utils = require('../test_utils');

var generateString = utils.generateString;

casper.test.begin('Test Entity Management', 3, function (test) {
  casper.start();
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
  casper.waitForText("This is the Iris administration area", function () {
    /**
    * Create record for entity page
    */
    var options = {
      url: config.baseURL + "/page/create",
      waitFor: 'input[name="title"]',
      formId: 'form[data-formid="entity"]',
      data: {
        'input[name = "title"]': generateString(10),
        'textarea[name = "body"]': generateString(100)
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
  casper.waitForText("Entities", function () {
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
  casper.run(function () {
    test.done();
  })
});
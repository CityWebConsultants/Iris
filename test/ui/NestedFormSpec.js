
var config = require('../test_config');
var util = require('../util/schema');

var utils = require('../test_utils');

var generateString = utils.generateString;
var schema = generateString(10).toLowerCase();

casper.test.begin('Test Nested Form fieldset', 8, function (test) {
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
  /**
 * Wait for login response redirect
 */
  casper.waitForText("This is the Iris administration area", function () {
    /**
    * Add Schema field
    */
    var options = {
      url: config.baseURL + "/admin/schema/create",
      waitFor: 'input[name="entityTypeName"]',
      formId: 'form[data-formid="schema"]',
      data: {
        'input[name = "entityTypeName"]': schema,
        'input[name = "entityTypeDescription"]': "sample only"
      }
    };
    util.test.openTransaction(options, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("create schema " + schema + " success");
        test.assertEquals(casper.getCurrentUrl(), 'http://www.iris.local:4000/admin/schema/create');
      }
    });
  });
  /**
   * Wait for create schema redirect
   */
  casper.waitForText("Manage " + schema + " fields", function () {
    /**
    * Add Schema field
    */
    var options = {
      url: config.baseURL + "/admin/schema/" + schema + "/fields",
      waitFor: 'input[name="label"]',
      formId: 'form[data-formid="schemaFieldListing"]',
      data: {
        'input[name = "label"]': schema + " textfield one",
        'input[name = "machineName"]': schema + "_textfield_one",
        'select[name = "fieldType"]': "Textfield"
      }
    };
    util.test.openTransaction(options, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("create schema field sample success");
        test.assertEquals(casper.getCurrentUrl(), "http://www.iris.local:4000/admin/schema/" + schema + "/fields");
      }
    });
  });
  
    /**
   * Wait for create textfield redirect
   */
  casper.waitForText("Edit field " + schema + "_textfield_one" + " : " + schema, function () {
    /**
    * Add Schema field
    */
    var options = {
      url: config.baseURL + "/admin/schema/" + schema + "/fields",
      waitFor: 'input[name="label"]',
      formId: 'form[data-formid="schemaFieldListing"]',
      data: {
        'input[name = "label"]': schema + " fieldset one",
        'input[name = "machineName"]': schema + "_fieldset_one",
        'select[name = "fieldType"]': "Fieldset"
      }
    };
    util.test.openTransaction(options, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("create schema field fieldset success");
        test.assertEquals(casper.getCurrentUrl(), "http://www.iris.local:4000/admin/schema/" + schema + "/fields");
      }
    });
  });
  
    /**
   * Wait for create fieldset redirect
   */
  casper.waitForText("Edit field " + schema + "_fieldset_one" + " : " + schema, function () {
    /**
    * Add Schema field
    */
    var options = {
      url: config.baseURL + "/admin/schema/" + schema + "/fieldset/" + schema + "_fieldset_one",
      waitFor: 'input[name="label"]',
      formId: 'form[data-formid="schemaFieldListing"]',
      data: {
        'input[name = "label"]': schema + " textfield two",
        'input[name = "machineName"]': schema + "_textfield_two",
        'select[name = "fieldType"]': "Textfield"
      }
    };
    util.test.openTransaction(options, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("create schema field sample success");
        test.assertEquals(casper.getCurrentUrl(), "http://www.iris.local:4000/admin/schema/" + schema + "/fieldset/" + schema + "_fieldset_one");
      }
    });
  });
  
    /**
   * Wait for create textfield redirect
   */
  casper.waitForText("Edit field " + schema + "_textfield_two" + " : " + schema, function () {
    /**
    * Add Schema field
    */
    var options = {
      url: config.baseURL + "/admin/schema/" + schema + "/fieldset/" + schema + "_fieldset_one",
      waitFor: 'input[name="label"]',
      formId: 'form[data-formid="schemaFieldListing"]',
      data: {
        'input[name = "label"]': schema + " fieldset two",
        'input[name = "machineName"]': schema + "_fieldset_two",
        'select[name = "fieldType"]': "Fieldset"
      }
    };
    util.test.openTransaction(options, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("create schema field fieldset success");
        test.assertEquals(casper.getCurrentUrl(), "http://www.iris.local:4000/admin/schema/" + schema + "/fieldset/" + schema + "_fieldset_one");
      }
    });
  });
     
    /**
   * Wait for create fieldset redirect
   */
  casper.waitForText("Edit field " + schema + "_fieldset_two" + " : " + schema, function () {
    /**
    * Add Schema field
    */
    var options = {
      url: config.baseURL + "/admin/schema/" + schema + "/fieldset/" + schema + "_fieldset_two",
      waitFor: 'input[name="label"]',
      formId: 'form[data-formid="schemaFieldListing"]',
      data: {
        'input[name = "label"]': schema + " textfield three",
        'input[name = "machineName"]': schema + "_textfield_three",
        'select[name = "fieldType"]': "Textfield"
      }
    };
    util.test.openTransaction(options, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("create schema field sample success");
        test.assertEquals(casper.getCurrentUrl(), "http://www.iris.local:4000/admin/schema/" + schema + "/fieldset/" + schema + "_fieldset_two");
      }
    });
  });
  
    /**
   * Wait for create textfield redirect
   */
  casper.waitForText("Edit field " + schema + "_textfield_three" + " : " + schema, function () {
    /**
    * Add Schema field
    */
    var options = {
      url: config.baseURL + "/admin/schema/" + schema + "/fieldset/" + schema + "_fieldset_two",
      waitFor: 'input[name="label"]',
      formId: 'form[data-formid="schemaFieldListing"]',
      data: {
        'input[name = "label"]': schema + " fieldset three",
        'input[name = "machineName"]': schema + "_fieldset_three",
        'select[name = "fieldType"]': "Fieldset"
      }
    };
    util.test.openTransaction(options, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("create schema field fieldset success");
        test.assertEquals(casper.getCurrentUrl(), "http://www.iris.local:4000/admin/schema/" + schema + "/fieldset/" + schema + "_fieldset_two");
      }
    });
  });
  /**
   * Wait for delete schema redirect
   */
  casper.waitForText("Edit field " + schema + "_fieldset_three" + " : " + schema, function () {
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
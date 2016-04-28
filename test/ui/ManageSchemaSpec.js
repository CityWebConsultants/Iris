
var config = require('../test_config');
var util = require('../util/schema');

var utils = require('../test_utils');

var generateString = utils.generateString;
var schema = generateString(10).toLowerCase();

casper.test.begin('Test Schema Management', 6, function (test) {
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
        console.log("create schema "+schema+" success");
        test.assertEquals(casper.getCurrentUrl(), 'http://www.iris.local:4000/admin/schema/create');
      }
    });
  });
  /**
   * Wait for login response redirect
   */
  casper.waitForText("Manage "+schema+" fields", function () {
    /**
    * Add Schema field
    */
    var options = {
      url: config.baseURL + "/admin/schema/"+schema+"/fields",
      waitFor: 'input[name="label"]',
      formId: 'form[data-formid="schemaFieldListing"]',
      data: {
        'input[name = "label"]': "Sample",
        'input[name = "machineName"]': "sample",
        'select[name = "fieldType"]': "Boolean"
      }
    };
    util.test.openTransaction(options, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("create schema field sample success");
        test.assertEquals(casper.getCurrentUrl(), "http://www.iris.local:4000/admin/schema/"+schema+"/fields");
      }
    });
  });
  /**
   * Wait for create schema field redirect
   */
  casper.waitForText("Edit field sample : "+schema, function () {
    /**
    * Edit Schema field
    */
    var options = {
      url: config.baseURL + "/admin/schema/"+schema+"/fields/sample",
      waitFor: 'input[name="fields.unique"]',
      formId: 'form[data-formid="schemafield"]',
      data: {
        'input[name = "fields.label"]': "Sample",
        'textarea[name = "fields.description"]': "sample description",
        'input[name = "fields.unique"]': true,
        'input[name = "fields.required"]': true
      }
    };
    util.test.openTransaction(options, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("edit schema field "+schema+" success");
        test.assertEquals(casper.getCurrentUrl(), "http://www.iris.local:4000/admin/schema/"+schema+"/fields/sample");
      }
    });
  });
  /**
   * Wait for edit schema field redirect
   */
  casper.waitForText("Manage "+schema+" fields", function () {
    /**
    * Delete Schema field
    */
    var options = {
      url: config.baseURL + "/admin/schema/"+schema+"/fields/sample/delete",
      waitFor: 'form[data-formid="schemafieldDelete"]',
      formId: 'form[data-formid="schemafieldDelete"]',
      data: {}
    };
    util.test.openTransaction(options, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("delete schema field success ");
        test.assertEquals(casper.getCurrentUrl(), "http://www.iris.local:4000/admin/schema/"+schema+"/fields/sample/delete");
      }
    });
  });
   /**
   * Wait for delete schema field redirect
   */
  casper.waitForText("Manage "+schema+" fields", function () {
    /**
    * Delete Schema
    */
    var options = {
      url: config.baseURL + "/admin/schema/"+schema+"/delete",
      waitFor: 'form[data-formid="schemaDelete"]',
      formId: 'form[data-formid="schemaDelete"]',
      data: {
        'input[name = "schema"]': schema,
      }
    };
    util.test.openTransaction(options, function (err, result) {
      if (err) {
        console.log(err);
      }
      else {
        console.log("delete schema success ");
        test.assertEquals(casper.getCurrentUrl(), "http://www.iris.local:4000/admin/schema/"+schema+"/delete");
      }
    });
  });
  /**
   * Wait for delete schema redirect
   */
  casper.waitForText("Entities", function () {
    /**
    * logout
    */
    util.test.logout( function (err, result) {
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
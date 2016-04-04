var Browser = require("zombie");
var config = require('./test_config');

Browser.localhost('localhost', 4000);

describe('Login user', function() {
  const browser = new Browser();

  beforeEach(function(next) {
    browser.visit('/admin',function(){
      return browser
        .fill('username', config.adminUser.login.username)
        .fill('password', config.adminUser.login.password)
        .pressButton('Submit', function() {
          browser.assert.success();
          next();
        });
    });
  });
  it('should be able to modify schema for user', function(next) {
    browser.visit('/admin/schema/user/username', function() {
      browser
        .fill('fields.unique', 1)
        .fill('fields.required', 1)
        .pressButton('Save field', function(){
          browser.assert.success();
          next();
        });
    });
  });
  it('and should not be able to create user with existing username', function(next) {
    browser.visit('/admin/create/user', function() {
      return browser
        .fill('username', 'poo')
        .fill('roles[0]', 'admin')
        .fill('password', 'poo')
        .pressButton('Save user', function(){
          browser.assert.status(404);
          next();
        });
    });
  });

});


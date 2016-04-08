module.exports = {
  test: {
    login: function(user, waitFor,next) {
      casper.thenOpen(config.baseURL + "/admin", function() {
        casper.waitForSelector(waitFor, function() {
          this.fillSelectors('form[data-formid="login"]', user, true);
          next();
        });
      })
    },
    createEntity: function(entity, data, waitFor,next) {
      casper.thenOpen(config.baseURL + "/admin/create/" + entity, function() {
        
        casper.waitForSelector(waitFor, function() {
          this.fillSelectors('form[data-formid="entity"]', data, true);
          next();
        });
      });
    },
    updateSchemaField: function(schema, data, waitFor,next) {
      casper.thenOpen(config.baseURL + "/admin/schema/user/fields/username", function() {
        
        casper.waitForSelector(waitFor, function() {
          this.fillSelectors('form[data-formid="schemafield"]', data, true);
          next();
        });

      });
    }
  }
};



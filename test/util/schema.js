module.exports = {
  test: {
    login: function(user, waitFor, next) {
      casper.thenOpen(config.baseURL + "/admin", function() {
        casper.waitForSelector(waitFor, function() {
          this.fillSelectors('form[data-formid="login"]', user, true);
          next();
        });
      })
    },
    createEntity: function(entity, data, waitFor, next) {
      casper.thenOpen(config.baseURL + "/"+entity+"/create" , function() {

        casper.waitForSelector(waitFor, function() {
          this.fillSelectors('form[data-formid="entity"]', data, true);
          next();
        });
      });
    },
    updateSchemaField: function(schema, field, data, waitFor, next) {
      casper.thenOpen(config.baseURL + "/admin/schema/" + schema + "/fields/" + field, function() {

        casper.waitForSelector(waitFor, function() {
          this.fillSelectors('form[data-formid="schemafield"]', data, true);
          next();
        });

      });
    }
  }
};



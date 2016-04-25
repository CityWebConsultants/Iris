module.exports = {
  test: {
    logout : function(next){
      casper.thenOpen(config.baseURL +"/user/logout", function () {
        next();
      });
    },    
    openTransaction: function (options,next) {
      if (options.url) {
        casper.thenOpen(options.url, function () {
          if (options.waitFor) {
            casper.waitForSelector(options.waitFor, function () {
              if (options.formId && options.data) {
                this.fillSelectors(options.formId, options.data, true);
                next();
              }
              else {
                next("Please include which html form to be filledand what data to fill in");
                
              }
            });
          } else {
              next("Please include which element to wait for prior to filling the form");
              
          }

        });
      }
      else {
        next("Please include valid url to open a transaction");
        
      }

    }
  }
};



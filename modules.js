C.m = {};

var moduleTemplate = (function () {

  var hooks = {};

  return {

    globals: {},
    registerHook: function (hookname, rank, callback) {

      if (typeof hookname === "string" && typeof rank === "number" && typeof callback === "function") {

        if (!hooks[hookname]) {

          hooks[hookname] = {

            rank: rank,
            event: callback

          }

        } else {

          console.log("Hook already defined in this module");

        }

      } else {

        console.log("Not a valid hook");
        return false;

      }

    },
    get hooks() {
      return hooks;
    },

  }

})

C.registerModule = function (name) {

  if (C.m[name]) {

    console.log("Module already exists");

  } else {

    C.m[name] = new moduleTemplate;
    Object.seal(C.m[name]);

  }

  return C.m[name];

};



//    // Automatically load modules
//    config.modules_enabled.forEach(function (element, index) {
//
//      //Initialise dbModels if any set in module
//
//      if (thisModule.dbModels) {
//
//        var models = thisModule.dbModels;
//
//        Object.keys(models).forEach(function (model) {
//
//          dbModels[model] = {
//            options: models[model],
//            moduleName: element.name,
//            model: {}
//          };
//
//        });
//
//      }
//
//      if (thisModule.dbSchemaFields) {
//
//        var schemaSets = thisModule.dbSchemaFields;
//
//        Object.keys(schemaSets).forEach(function (model) {
//
//          if (dbModels[model]) {
//
//            //dbModel exists
//
//            var schemaFields = schemaSets[model];
//
//            Object.keys(schemaFields).forEach(function (field) {
//
//              //Add or overwrite a field in a schema model
//
//              dbModels[model].model[field] = schemaFields[field];
//
//            })
//
//          } else {
//
//            console.log(model + " is not a valid dbModel");
//
//          }
//
//        });
//
//      }
//
//      console.log(element.name);
//
//    });

Core functions
==============

C.registerModule(name);

C.registerDbCollection(name);

C.registerDbSchema(collectionName, schemaFieldsObject);

CM[modulename].registerHook(hookName, rank, callback(thisHook, data){});

C.app

C.hook(hookname,data,authPass)

C.promiseChain (promisesArray, data, pass, fail);

C.promise(function(data,yes,no){});

C.include(default, otherlocation);

C.getModulePath(name);

C.sitePath

C.configPath

C.registerTranslation(string, translation);

C.translate(stringWithPlaceHolders, variables);

C.log.info();

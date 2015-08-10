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

C.registerPermission(name);

Hooks
=====

## Create entity
  
Hook_entity_access_create
Hook_entity_access_create_type

Variables: AuthPass and type to be created

Pass: Return YES and/or schema. Can optionally pass onto creating entity hook.
Fail: Return "access denied"

## Creating entity

Hook_entity_create
Hook_entity_create_type

Variables: AuthPass and entity fields (including type)

Pass: Create entity, run created entity hooks.
Fail: Return validation errors.

## Created entity

Hook_entity_created
Hook_entity_created_type

Variables: AuthPass and created entity

Pass: Return created entity.
Database error: Return error.

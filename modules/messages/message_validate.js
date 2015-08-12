//Validate creation of message

CM.group_manager.registerHook("hook_entity_validate_message", 0, function (thisHook, data) {

  var entity = data.body;



  var pass = function (data) {

    thisHook.finish(true, data);

  }

  var fail = function (data) {

    thisHook.finish(false, data);

  }

//  C.promiseChain([], entity, pass, fail);

});

CM.group_manager.registerHook("hook_entity_view_group", 0, function (thisHook, data) {

  //Strip out IDs

//  data.forEach(function (group, index) {
//
//    data[index]._id = undefined;
//
//  });

  thisHook.finish(true, data);

});

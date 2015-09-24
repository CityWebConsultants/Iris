//Example form

CM.forms.globals.makeForm("example", {
  name: {
    type: 'string',
    title: 'Name',
    required: true,
  },
  about: {
    type: 'textarea',
    title: 'About'
  }
});

CM.forms.registerHook("hook_form_schema_alter_example", 0, function (thisHook, data) {

  data.schema["hello"] = {

    type: "string",
    title: "New",
    required: false

  }

  thisHook.finish(true, data);

})


CM.forms.registerHook("hook_form_submit_example", 0, function (thisHook, data) {

  console.log(thisHook.const.params);

  thisHook.finish(true, "/docs");

});

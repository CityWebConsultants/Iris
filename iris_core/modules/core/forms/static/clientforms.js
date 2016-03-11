iris.forms = {};

$(document).on("ready", function () {

  Object.keys(iris.forms).forEach(function (form) {
        
    $("#"+form).jsonForm(iris.forms[form]);

  })

})

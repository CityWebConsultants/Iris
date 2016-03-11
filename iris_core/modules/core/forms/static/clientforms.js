iris.forms = {};

$(document).on("ready", function () {
  Object.keys(iris.forms).forEach(function (form) {
    $("#"+form).jsonForm(iris.forms[form].form);
    var tmpFunc = new Function(iris.forms[form].onComplete + "()");
    if (typeof window[iris.forms[form].onComplete] == 'function') {
      tmpFunc();
    }
  })

});

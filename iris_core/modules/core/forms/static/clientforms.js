iris.forms = {};

$(document).on("ready", function () {
  Object.keys(iris.forms).forEach(function (form) {
    $("#"+form).jsonForm(iris.forms[form].form);
    var tmpFunc = new Function(iris.forms[form].onComplete + "()");
    if (typeof window[iris.forms[form].onComplete] == 'function') {
      tmpFunc();
    }
  })

  $( "html" ).on( "click", ".form-group[data-jsonform-type=array] > label", function(e) {
    $(this).next().slideToggle();
  });

});

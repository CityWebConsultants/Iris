iris.forms = {};

$(document).on("ready", function () {
  iris.forms.cache = [];

  iris.forms.renderForm = function(formId){
    if(iris.forms.cache.indexOf(formId) > -1) return;
    $("#"+formId).jsonForm(iris.forms[formId].form);
    var onComplete = new Function(iris.forms[formId].onComplete + "()");
    if (typeof window[iris.forms[formId].onComplete] == 'function') {
      onComplete();
    }
    iris.forms.cache.push(formId);
  }

  Object.keys(iris.forms).forEach(function (form) {
    iris.forms.renderForm(form);
  })

  $( "html" ).on( "click", ".form-group[data-jsonform-type=array] > label", function(e) {
    $(this).next().slideToggle();
  });


});

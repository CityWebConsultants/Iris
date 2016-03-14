iris.forms = {};

$(document).on("ready", function () {
  iris.forms.cache = [];
  var $form;
  iris.forms.renderForm = function(formId){
    if(iris.forms.cache.indexOf(formId) > -1) return;
    $form = $("#"+formId);
    $form.jsonForm(iris.forms[formId].form);

    $form.on( "click", ".form-group[data-jsonform-type=array] > label", function(e) {
      $(this).next().slideToggle();
    });

    var onComplete = new Function(iris.forms[formId].onComplete + "()");
    if (typeof window[iris.forms[formId].onComplete] == 'function') {
      onComplete();
    }
    iris.forms.cache.push(formId);
  };

  Object.keys(iris.forms).forEach(function (form) {
    iris.forms.renderForm(form);
  })






});

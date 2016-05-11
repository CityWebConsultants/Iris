iris.forms = {};

$(window).load( function () {
  iris.forms.cache = [];
  var $form;

  iris.forms.renderForm = function(formId){
    if(iris.forms.cache.indexOf(formId) > -1 || !iris.forms[formId].form) return;
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

    if (iris.forms[form].form && typeof iris.forms[form].form.onSubmit != 'function') {
      iris.forms[form].form.onSubmit = iris.forms.onSubmit;
    }
    iris.forms.renderForm(form);
  });

  // Fire event after all forms have loaded.
  iris.formsLoaded = new Event('formsLoaded');
  document.dispatchEvent(iris.formsLoaded);

});

iris.forms.onSubmit = function(errors, values) {

  $('#' + values.formid + values.formToken).find('input[type=submit]').addClass('active');
  $.ajax({
    type: "POST",
    contentType: "application/json",
    url: window.location,
    data: JSON.stringify(values),
    dataType: "json",
    success: function (data) {

      $('#' + values.formid + values.formToken).find('input[type=submit]').removeClass('active');

      if (data.errors) {

        $("body").animate({
          scrollTop: $("[data-formid='" + values.formid + "'").offset().top
        }, "fast");

        var errorMessages = '';

        // As this may be a second submission attempt, clear all field errors.
        $('.form-control', $("[data-formid='" + values.formid + "'")).removeClass('error');

        for (var i = 0; i < data.errors.length; i++) {

          errorMessages += "<div class='alert alert-danger'>" + data.errors[i].message + "</div>";

          if (data.errors[i].field) {

            $("input[name=" + data.errors[i].field + ']').addClass('error');

          }

        }

        // If the form-errors div already exists, replace it, otherwise add to top of form.
        if ($('.form-errors', $("[data-formid='" + values.formid + "'")).length > 0) {

          $('.form-errors', $("[data-formid='" + values.formid + "'")).html(errorMessages);

        } else {

          $("[data-formid='" + values.formid + "'").prepend('<div class="form-errors">' + errorMessages + '</div>');

        }

      } else if (data.messages && data.messages.length > 0) {

        $("body").animate({
          scrollTop: $("[data-formid='" + values.formid + "'").offset().top
        }, "fast");

        var messages = '';
        data.messages.forEach(function (obj) {

          messages += "<div class='alert alert-" + obj.type + "'>" + obj.message + "</div>";

        });

        // If the form-errors div already exists, replace it, otherwise add to top of form.
        if ($('.form-messages', $("[data-formid='" + values.formid + "'")).length > 0) {

          $('.form-messages', $("[data-formid='" + values.formid + "'")).html(messages);

        } else {

          $("[data-formid='" + values.formid + "'").prepend('<div class="form-messages">' + messages + '</div>');

        }

      } else if (data.redirect) {

        window.location.href = data.redirect;

      } else {

        if (data && data.indexOf("doctype") === -1) {

          window.location.href = data;

        } else {

          window.location.href = window.location.href;

        }

      }

    }
  });

}

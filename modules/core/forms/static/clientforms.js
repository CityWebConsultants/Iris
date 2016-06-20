iris.forms = {};

iris.lazyLoad = function(filename, filetype){
  if (filetype=="js"){ //if filename is a external JavaScript file
    var fileref=document.createElement('script')
    fileref.setAttribute("type","text/javascript")
    fileref.setAttribute("src", filename)
  }
  else if (filetype=="css"){ //if filename is an external CSS file
    var fileref=document.createElement("link")
    fileref.setAttribute("rel", "stylesheet")
    fileref.setAttribute("type", "text/css")
    fileref.setAttribute("href", filename)
  }
  if (typeof fileref!="undefined")
    document.getElementsByTagName("head")[0].appendChild(fileref)
}

$(window).load( function () {
  iris.forms.cache = [];
  var $form;

  iris.forms.renderForm = function(formId){
    if(iris.forms.cache.indexOf(formId) > -1 || !iris.forms[formId].form) return;
    $form = $("#"+formId);
    $form.jsonForm(iris.forms[formId].form);

    $.each($(".form-group[data-jsonform-type=array]", $form), function(index, value) {

      if ($(value).prev().hasClass('control-label')) {

        $(value).find('.controls').first().hide();

        $(value).find('label').first().click(function(e) {

          $(this).next().slideToggle();

        });

      }

    });


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

  function processErrors(errors) {

    $('#' + values.formid + values.formToken).find('button[type=submit]').removeClass('active');
    $("body").animate({
      scrollTop: $("[data-formid='" + values.formid + "'").offset().top
    }, "fast");

    var errorMessages = '';

    // As this may be a second submission attempt, clear all field errors.
    $('.form-control', $("[data-formid='" + values.formid + "'")).removeClass('error');

    for (var i = 0; i < errors.length; i++) {

      errorMessages += "<div class='alert alert-danger'>" + errors[i].message + "</div>";

      if (errors[i].field) {

        $("input[name=" + errors[i].field + ']').addClass('error');

      }

    }

    // If the form-errors div already exists, replace it, otherwise add to top of form.
    if ($('.form-errors', $("[data-formid='" + values.formid + "'")).length > 0) {

      $('.form-errors', $("[data-formid='" + values.formid + "'")).html(errorMessages);

    } else {

      $("[data-formid='" + values.formid + "'").prepend('<div class="form-errors">' + errorMessages + '</div>');

    }

  };

  if (errors) {

    processErrors(errors);
    return false;

  }

  setTimeout(function() {
    $('#' + values.formid + values.formToken).find('button[type=submit]').addClass('active');
  }, 300);

  $.ajax({
    type: "POST",
    contentType: "application/json",
    url: window.location,
    data: JSON.stringify(values),
    dataType: "json",
    error: function(jqXHR, textStatus, errorThrown) {

      processErrors([{'message' : "Error processing form"}]);

    },
    success: function (data) {

      if (data.errors && data.errors.length > 0) {

        processErrors(data.errors);

      } else if (data.messages && data.messages.length > 0) {

        $('#' + values.formid + values.formToken).find('button[type=submit]').removeClass('active');

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

      } else  {

        function waitForRestart() {

          $.ajax({
            url: data.redirect ? data.redirect : window.location.href,
            success: function(result){

              JSONForm = null;
              var newDoc = document.open("text/html", "replace");
              newDoc.write(result);
              newDoc.close();
            },
            error: function(result){
              setTimeout(waitForRestart, 2000);
            }
          });

        }

        if (data.callback) {

          data.redirect = data.callback;

        }

        if (data.restart) {

          setTimeout(waitForRestart, 2000);

        }
        else {

          window.location.href = data.redirect ? data.redirect : window.location.href;

        }

      }

    }
  });

}

iris.forms = {};

$(window).load(function () {
  iris.forms.cache = [];
  var $form;

  // Allow JSONForm field schema object to set form render object settings directly

  Object.keys(JSONForm.elementTypes).forEach(function (type) {

    var elementType = JSONForm.elementTypes[type];

    if (!elementType.onBeforeRender) {

      elementType.onBeforeRender = function () {


      };

    }

    var old = elementType.onBeforeRender;
    elementType.onBeforeRender = function () {

      if (arguments[1].schemaElement && arguments[1].schemaElement.renderSettings) {


        if (!arguments[1].formElement) {

          arguments[1].formElement = {};

        }

        Object.assign(arguments[1].formElement, arguments[1].schemaElement.renderSettings);
        Object.assign(arguments[1], arguments[1].schemaElement.renderSettings);

      }

      old.apply(this, arguments);
    };

  })

  // Remove static forms.
  $("[data-static-form]").remove();

  iris.forms.renderForm = function (formId) {
    if (iris.forms.cache.indexOf(formId) > -1 || !iris.forms[formId].form) return;
    $form = $("#" + formId);
    $form.jsonForm(iris.forms[formId].form);

    $.each($(".form-group[data-jsonform-type=array]", $form), function (index, value) {

      if ($(value).prev().hasClass('control-label')) {

        $(value).find('.controls').first().hide();

        $(value).find('label').first().click(function (e) {

          $(this).next().slideToggle();

        });

      }

    });


    $form.on("click", ".form-group[data-jsonform-type=array] > label", function (e) {
      $(this).next().slideToggle();
    });

    var onComplete = new Function(iris.forms[formId].onComplete + "()");
    if (typeof window[iris.forms[formId].onComplete] == 'function') {
      onComplete();
    }
    iris.forms.cache.push(formId);
  };

  var totalForms = Object.keys(iris.forms).length;
  Object.keys(iris.forms).forEach(function (form, index) {

    if (iris.forms[form].form && typeof iris.forms[form].form.onSubmit != 'function') {
      iris.forms[form].form.onSubmit = iris.forms.onSubmit;
    }
    iris.forms.renderForm(form);

    if (index == totalForms - 1 && typeof window.formComplete_all == "function") {
      formComplete_all();
    }

  });

  // Fire event after all forms have loaded.
  iris.formsLoaded = new Event('formsLoaded');
  document.dispatchEvent(iris.formsLoaded);

});

iris.forms.onSubmit = function (errors, values) {

  var hasReturned = false;

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

  setTimeout(function () {

    if (!hasReturned) {
      $('#' + values.formid + values.formToken).find('button[type=submit]').addClass('active');
    }

  }, 300);

  $.ajax({
    type: "POST",
    contentType: "application/json",
    url: window.location,
    data: JSON.stringify(values),
    dataType: "json",
    error: function (jqXHR, textStatus, errorThrown) {

      hasReturned = true;
      processErrors([{
        'message': "Error processing form"
      }]);

    },
    success: function (data) {

      hasReturned = true;
      $('#' + values.formid + values.formToken).find('button[type=submit]').removeClass('active');

      if (data.errors && data.errors.length > 0) {

        processErrors(data.errors);

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

      }
      else if (data.callback) {

        window.location.href = data.callback;

      }
      else if (data.restart) {

        hasReturned = false;
        function waitForRestart() {

          $.ajax({
            url: data.redirect ? data.redirect : window.location.href,
            success: function (result) {

              JSONForm = null;
              var newDoc = document.open("text/html", "replace");
              newDoc.write(result);
              newDoc.close();
            },
            error: function (result) {
              setTimeout(waitForRestart, 2000);
            }
          });

        }

        setTimeout(waitForRestart, 2000);

      }
      else {

        if (data.execute) {

          function executeFunctionByName(functionName, context , args) {
            var args = Array.prototype.slice.call(arguments, 2);
            var namespaces = functionName.split(".");
            var func = namespaces.pop();
            for (var i = 0; i < namespaces.length; i++) {
              context = context[namespaces[i]];
            }
            return context[func].apply(context, args);
          }

          executeFunctionByName(data.functionName, window, data.arguments);

        }
        else {
          window.location.href = data.redirect ? data.redirect : window.location.href;
        }

      }
    }
  });

}

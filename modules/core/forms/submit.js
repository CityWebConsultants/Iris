/**
 * Request handler hook
 *
 * Used to respond to an HTTP request.
 */
/*
 * hook_catch_request is used here to respond to form submissions.
 */
iris.modules.forms.registerHook("hook_catch_request", 0, function (thisHook, data) {

  // Call submit handlers that specify the form name
  var specificFormSubmit = function (data) {

    if (typeof data !== "function") {

      thisHook.pass(function (res) {

        res.json(data);

      });

    } else {

      thisHook.pass(data);

    }

  };

  // Call all generic submit handlers.
  var genericFormSubmit = function (data) {

    var previous = body.formPrevious;

    delete body.formPrevious;

    iris.invokeHook("hook_form_submit__" + formid, thisHook.authPass, {
      params: body,
      formid: formid,
      previous: previous,
      req: thisHook.context.req,
      res: thisHook.context.res
    }, data).then(specificFormSubmit, function (fail) {

      var errors;

      if (typeof fail === "string") {

        errors = [{
          message: fail
        }];

      } else {

        errors = fail;

      }

      thisHook.pass(function (res) {

        res.json({
          errors: errors
        });

      });

    });

  };

  // Run all validation hooks specific to the form being procesed.
  var specificFormValidate = function (data) {

    // If any errors were found, do not trigger submit handlers.
    if (data.errors && data.errors.length > 0) {

      var callback = function (res) {

        res.json({
          errors: data.errors
        });

      };

      thisHook.pass(callback);

    } else {
      iris.invokeHook("hook_form_submit", thisHook.authPass, {
        params: body,
        formid: formid,
        req: thisHook.context.req
      }, data).then(genericFormSubmit, function (fail) {

        thisHook.fail(fail);

      });
    }
  };

  var genericFormValidate = function (data) {

    iris.invokeHook("hook_form_validate__" + formid, thisHook.authPass, {
      params: body,
      formid: formid,
      req: thisHook.context.req
    }, data).then(specificFormValidate, function (fail) {

      thisHook.fail(fail);

    });

  };



  if (thisHook.context.req.method === "POST") {

    // Check if posted without JavaScript

    var nojs;

    if (thisHook.context.req.query && thisHook.context.req.query.nojs) {

      nojs = true;
      var nativeJSON = thisHook.context.res.json;
      thisHook.context.res.json = function (body) {

        if (body.redirect || body.callback) {

          thisHook.context.res.redirect(body.redirect);

        } else {

          thisHook.context.res.redirect(thisHook.context.req.url);

        }

      };

    }

    var body = thisHook.context.req.body;

    if (body && body.formid && body.formToken) {

      // Check if form id exists in cache, if not stop

      if (iris.modules.forms.globals.formRenderCache[body.formToken]) {

        var token = iris.modules.forms.globals.formRenderCache[body.formToken];

        if (token.userid === thisHook.authPass.userid && body.formid === token.formid) {

        } else {

          thisHook.fail("Bad request");
          return false;

        }

      } else {

        thisHook.fail("Bad request");
        return false;

      }

      delete body.formToken;

      var formid = body.formid;

      delete body.formid;

      delete thisHook.context.req.body.formToken;
      delete thisHook.context.req.body.formid;


      iris.invokeHook("hook_form_validate", thisHook.authPass, {
        params: body,
        formid: formid,
        req: thisHook.context.req
      }, {
        errors: [],
        messages: [],
        callback: null
      }).then(genericFormValidate, function (fail) {

        thisHook.pass(data);

      });



    } else {

      thisHook.pass(data);

    }

  } else {

    thisHook.pass(data);

  }



});

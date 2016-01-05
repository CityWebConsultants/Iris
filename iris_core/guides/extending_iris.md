# Extending Iris

## What is a module?

Iris can be extended by adding modules. Modules can contain JavaScript that implements new functionality and hooks into and changes existing behaviours, as well as adding new templates for the theming system and defining new entity types. Essentially anything can be changed by adding a module.

## Creating a new module

### Create or install a module

To extend Iris by creating a new module, create a directory in your sites/modules folder named after the module (lowercase letters and underscores only are recommended).

Within this file, put in a JavaScript file named the same thing as your module folder.

mymodule/mymodule.js for example.

In this file, register the file as an Iris module by using the iris.registerModule function.

```javascript

iris.registerModule("mymodule");

```

### Enable a module

To enable a module, go to your site's folder and edit its enabled_modules.json file.

Put in the path to and name of the module you are enabling in the enabled_modules list.

Then restart or start the server and the module should be loaded.

If you are having trouble enabling a module, make sure to check the logs for error messages or warnings relating to the module.

### Defining functions and properties of a module

When a module is created and enabled it is automatically added to the global iris.modules object.

For example: `iris.modules.mymodule`

This object has the following properties.

* __path__ - fixed, non-editable path to the module's folder
* __registerSocketListener__ - allows a module to register a websocket listener. See the documenation on websockets.
* __registerHook__ allows a module to register a hook (see the documenation on the hook system)
* __globals__ - An object for a modules custom properties and functions. This is the only part of a module that is directly writeable. It is also accessible by other modules. For example _iris.modules.mymodule.myfunction()_

Modules can also have their own package.json files for defining dependencies. These dependencies are installed into the root node_modules folder when calling the root _NPM install_. See node.js/npm documenation for information on writing package.json files.

## Hooks

### The hook system

Most of the core Iris functionality is based around a system of hooks.

Hooks are chains of events that a module can latch onto and optionally pass/change parameters passed to subsequent hooks in the chain.

### Registering a hook

Hooks need to be registered by Iris modules (see the section on creating Iris modules).

Only one instance of the same hookcan be registered by a single Iris module using its registerHook function.

Here's an example:

```JavaScript

iris.modules.myModule.registerHook("hook_my_hook", 0, function(thisHook, data){

  if(thisHook.const.good === true) {

    thisHook.finish(true, data);

  } else {

    thisHook.finish(false, data);

  }

})

```

The first parameter to registerHook is then name of the hook. The second is the weight/rank of the hook instance (higher weights get called later in the chain), the final parameter is the function that contains the actual hook callback.

This always gets two parameters.

#### thisHook

The thisHook parameter stores information about the currently called hook, any parameters passed to it by the first triggering of the hook, the user that triggered the initial the hook and callbacks for success or fail actions.

* __thisHook.const__ - This stores parameters that are accessible to every hook in the chain. Its contents cannot be changed.
* __thisHook.authPass__ - This is the authPass of the user that called the hook, containing their user id and roles.
* __thisHook.finish__ - This is a function that allows a user to finish the current hook instance in either a pass or a fail.

##### Finishing a hook call

In order for a hook to move along in the chain, each instance __must__ finish or the hook will stall forever. It can either pass or fail. Both pass and fail are triggered through the thisHook.finish function.

This function takes two parameters. The first is a boolean (true/false) that states whether the hook succeeds or fails. If it fails, any subsequent hooks in the chain will not be called and the hook's fail function will run. The second parameter is a data object (usually the same or modified data object as the hook instance was passed) to pass to the next hook or the hook's fail function.

For example

```
data.hello = "world";

thisHook.finish(true, data);

```

adds the hello property to the data object and passes that to the next hook in the chain.


#### data

This is the optional, mutable data object that is passed between hooks in a chain.

### Triggering a hook

To trigger a hook, use the iris.hook function.

For example

```
iris.hook("hook_example", req.authPass, contants, variables).then(function(success){

  iris.log("info", success);

}, function(fail){

  iris.log("error", fail)

})

```

The parameters, in order are:

* The name of the hook
* The authPass of the user calling the hook. You can also pass in the string "root" to run the hook as an admin user.
* An object of constants to pass through to the hook.
* Additional variables to pass through the hook (this forms the data parameter for the first hook instance in the chain)

The hook returns a JavaScript ECMASCRIPT 5 promise so you can respond with a different function after the hook chain completes depending on if it passes or fails. This complete function gets the final data object that was passed to the final thisHook.finish function in the chain.

### List of hooks

For the list of hooks provided by the core modules (and extras provided in the standard distribution), please refer to the **JSDoc** documentation. It includes lists of internal functions and hooks as well as descriptions of what they do.

## Forms

### The form system

Iris includes a Form system. This allows for creating fully working HTML forms from simple JSON schemas, including submit handlers that work using the hook system, allowing other modules to hook into the form and extend it if necessary.

### Registering a form

To register a form in Iris, use the hook_form_render_FORMNAME hook. Forms in Iris are rendered using the JSON Form library (ulion.github.io/jsonform/). The hook_form_render hook gets a data object containing a schema, form and value object that can be added to using the JSON Form field types. For example:

``` JavaScript

iris.myModule.registerHook("hook_form_render_myForm", 0, function(thisHook, data){

  data.schema.title = {

    "type": "text",
    "title": "My title",
    "description": "Put a title here"

  }

  thisHook.finish(true,data)

})

```

Additional hooks in the chain can add additional fields so modules can alter this form or one provided by the core system if they need to.

### Rendering a form

To render a form on a page simply use an embed like:

```

[[[form formName]]]

```

Additional parameters can also be passed through which are available in the thisHook object of the render function.

```
[[[form formName,helloworld]]]

```

### Registering a submit handler

The hook_form_submit_FORMNAME hook can be used to register an action. Its optional data object is a function that acts on the express res object and returns a url to redirect to. Parameters from the form are stored in thisHook.const.params

``` JavaScript

iris.myModule.registerHook("hook_form_submit_myForm", 0, function(thisHook, data){

  // Do something with the form data stored in thisHook.const.params

  thisHook.finish(true, function(res) {

    res.send("/home")

  })

})

```

### Altering an existing form

By invoking `hook_form_render` with a rank of 1 or higher, it is possible to make changes to a form once the hook that initially created it has finished.

For example, in order to edit myForm and add a field:

``` JavaScript

iris.myModule.registerHook("hook_form_render_myForm", 1, function(thisHook, data){

  data.schema.newfield = {

    "type": "text",
    "title": "My extra field",
    "description": "This extra field was added by another module!"

  }

  thisHook.finish(true,data)

});
```

### Altering the submit handler of an existing form

By invoking `hook_form_submit` with a rank of 1 or higher, it is possible to make changes or even completely override how a form is handled.

Say we would like to count submissions of myForm:


``` JavaScript

iris.myModule.registerHook("hook_form_submit_myForm", 0, function(thisHook, data){

  thisHook.finish(true, function(res) {

    iris.myModule.globals.myFormSubmissions.push(thisHook.const.params);

  })

})

```

## Routing

### The routing system

Iris' routing system is based on Express, a popular library for Node. It handles the loading of entities and error pages, and allows for modules to register new API endpoints and even entirely new pages.

The documentation for Express may be useful for developing modules that need to serve up their own custom pages or manage their own API. It can be found at **http://expressjs.com**.

### Using Express to add API endpoints and pages

The Express `app` object is made available as the global object `iris.app`.

To add a handler for an HTTP request on a given URL, use `iris.app.get` and `iris.app.post`, like below:

``` JavaScript
iris.app.get("/admin/regions", function (req, res) {

  res.send("This is the response");

});
```

The `req` object is the Express **request** object, which includes req.params for route parameters and req.query for the GET query string.

The `res` object is the Express **response** object, which has a .send() method for returning data.

For more information on how to use Express, check out its documentation and the below example.

### Registering a custom page with templating

The frontend module's parseTemplateFile function can be used to run a custom module page through the Iris theme system.

Create an HTML template in your modules /templates folder.

Then set up a standard express handler for the page.

iris.modules.frontend.globals.parseTemplateFile takes the following parameters in order.

* An array of template suggestions to look for (page, helloworld) would look for page_helloworld.html, then page.html
* An array of HTML wrapper template suggestions to look for
* An object to be passed to the handlebars templating engine which can then be used on the HTML page templates.
* An authPass with which to run the page.
* The express req object (for cookies and other request information)

This returns a JavaScript promise.

Here's an example from the regions page in the admin system.

```JavaScript

iris.app.get("/admin/regions", function (req, res) {

  iris.modules.frontend.globals.parseTemplateFile(["admin_regions"], ['admin_wrapper'], {
    blocks: iris.modules.blocks.globals.blocks,
  }, req.authPass, req).then(function (success) {

    res.send(success)

  }, function (fail) {

    iris.modules.frontend.globals.displayErrorPage(500, req, res);

    iris.log("error", e);

  });

})


```

## Entities

### Registering an entity type in code

## Users

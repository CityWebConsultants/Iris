# Iris

Iris is a modular content management system and web application framework built using JavaScript and MongoDB. It comes with a user, role and permission system, a flexible theme, block, field and entity system and an administrative UI so you can get started without writing any JavaScript or dive deep into it by using its hook system to build custom modules.

Iris comes with its own form system, powered by simple JSON form schema and one line widgets for fetching, filtering and sotritng entities (pages for example) that not only handle all the database queries and access permissions for you but can automatically live update without page refresh so you can use them for news feeds, social media websites and chat rooms. Without writing any server side code.

Iris comes with an extendable user, profile, role and permission system with a graphical admin interface so you can make sure only people with the right permissions can access content you want or perform actions.

Although we'd love you to build and share custom modules, and provide a full hook based API for doing so (meaning you can override or extend anything you'd want to override), a lot of Iris is built to be used without writing masses of extra JavaScript. The admin interface will allow you to build up blocks, regions, users, views/lists of content, make custom content types, attach fields to them and create, edit and delete content all through a graphical user interface.

Iris was built with version control in mind so, instead of storing blocks, regions, fields and entity types, views and other configuration in the database, all configuration you'd want to put through Git or another version control system is stored in easily exportable/importable JSON files. You can see if and what has changed through the graphical interface. You can even edit these configuration files manually if you want as they're written to be human-readable. The exporting and importing is again done through the user interface, though if you prefer drag and drop exporting and importing you can do that too and nothing will break.

After a year of keeping it to ourselves, we'd love you to try out Iris, let us know what we've done right and wrong and help us build it by contributing to its source code and building modules.

## System requirements

Iris runs on Node.js so you'll need the latest version of that installed (5.0 at the time of writing). It will also need a connection to a MongoDB database. Iris was created and tested on Windows, Linux and OSX systems so hopefully it will work on your setup. Put in an issue in the issue queue if it doesn't and we'll try to help.

## Directory structure

In the root directory you should find the core package.json file, this readme and an iris.js launch file. Once you have run NPM install you should have the following three directories.

* iris_core
* node_modules
* home

### iris_core

This is where the core iris files are stored along with core modules and the optional modules that are bundled with Iris. You should not edit these files as future updates to the Iris system would overwrite your changes. We have built a hook and template prioity system that should allow you to do all the overriding you want outside of this directory.

### node_modules

This is where all the extra node.js packages are installed. Iris modules themselves also install their dependencies into this folder automatically when running npm install from the root directory.

### Home directory

This is your folder! All your custom code, themes, templates, configuration and modules can go in here. It will be the one you put in a version control repository.

Step into it and you'll find three directories.

* themes
* sites
* modules

### Home - Theme folder

#### Themes and theme structure

The themes directory is where you will put a theme that your site/application will use on the front end. We have bundled in a base theme.

Theme folders contain three parts.

* __static folder__ - Everything in this folder will be accessible directly through a URL. It's for CSS files, image files such as logos and front end JavaScript files for your theme. The url for anything in this directory will be: **your app url + /theme/static/...**
* __theme.json__ - This file is the configuration for the theme you are using. It currently contains a list of regions. These are the regions supported by the theme that you can put blocks into. You can override the setttings in this file by putting your own theme.json file in your site's folder inside the home/sites directory.
* __templates__ folder. This is where HTML templates (including Handlebars template code) are stored. See **Template lookups, naming and overrides** section for more inforamtion about how templates work.

#### Template lookups, naming and overrides

Template lookups in Iris are done using a system based on folder location and underscore divided sections. Here's how this works:

#### Template naming

A theming function within the Iris system requests a template, passing through a list of parameters. For example, when requesting the template for an entity display (a page for example), these are:

* The entity type (page)
* The entity ID

A generic **page.html** template would match this lookup. If you wanted to use a different template for a specific page, you could simply add an underscore and the entity ID to this filename. So **page_5.html** for example.

Menus and other templates work in a similar way. **menu.html** is the general menu template **menu_menuname.html** is more specific and takes priority.

#### Where Iris looks for templates.

The template system starts looking through the file system by looking at core and contributed Iris modules for a /templates folder. If a module has a templates folder it is checked for relevant templates. The later the module is loaded, the higher a priority it takes.

After checking modules, the system looks through the current theme in its home/themes/THEMENAME/templates folder.

Finally, the system checks the sites/SITENAME/templates folder. These files take the top priority.

So modules, themes and sites can easily override any other template files set in the system or fall back to defaults.

### Home - Sites folder

The sites folder is where you put your sites/applications. When you clone Iris you should find a default site. Make your own by copying this default directory to its own folder named after your site. This directory name is important as you'll use it to launch the site.

Inside you'll find the following:

* __configurations__ - importable and exportable JSON configuration files for entity types, blocks, views and more are stored here.
* __files__ - Files uploaded into your site by its users are put here.
* __logs__ - This is where logs such as error or debug logs are stored. These can be viewed in the administrative interface. Feel free to back them up to another location or delete them when needed.
* __static__ - As with a themes or module's static folder, all files here are visible via a url. YOUSITEURL/static/...
* __templates__ - This is where template overrides go. See template naming in the themes section to see how this works.
* __enabled_modules.json__ - This lists all the optional Iris modules that are enabled on this site (essential core modules are enabled automatically). The order is important as they are loaded in this order.
* __settings.json__ - The global settings for the site can be found here.

#### settings.json

This is where you will put the main configuration for your site including database connection details and the server port the application runs on.

* __port__: The port the Node.JS web server runs on. (80 or 3000 for example)
* __https__: set to true or false depending on whether the site is running on HTTPS.
* __https_key__: System path to the SSL key if HTTPS mode is on.
* __https_cert__: System path to the SSL certificate if HTTPS mode is on.
* __db_server__: the server hosting the database (localhost for example).
* __db_port__: The MongoDB database port (27017 for example).
* __db_name__: The name of the MongoDB database used for this application.
* __db_username__: The username (if relevant) to be used when connecting to the database.
* __db_password__: The password (if relevant) to be used when connecting to the database.
* __theme__: The relative path to the current theme (we've put in a default __base__ theme to get you started).

## User system

Iris comes with a user system which allows people to log in to your website/application and see/do different things depending on their role.

### First time login and root user

When you first load Iris you will be shown a form where you can create an initial user account. This will be your root administrative user. Don't forget this username and password to stop yourself being locked out of the system.

### Logging in

To log in to the administration system, visit /admin or /login and type in your access details.

### The user entity

The user entity is a fieldable entity like any other, except for the password field (which is hashed and stored securely in the database), and a roles field where users can be given roles to allow various permissions.

### Roles and permissions

The base installation comes with three roles, anonymous (given automatically to not logged in users), authenticated (users that have logged in but have no extra roles (again given automatically)) and "admin". Admin allows a user to administrate the whole system so should be given sparingly.

More roles can be added with one line of code in a custom module. 

```javascript

iris.modules.auth.globals.registerRole("contributor");

```

This instantly makes it visible and usable in the permissions user interface. How a role is assigned to a user is up to you and your module.

Some permissions have already been created such as permissions to create, delete, view and edit entities of various types. Modules can register additional permissions.

```javascript

iris.modules.auth.globals.registerPermission("can make access token", "auth", "this allows a user to make access tokens for other users to access the system")

```

To grant or revoke a permission for a role, visit the permissions tab in the administration toolbar and select/unselect the relevat box for the role/permission. Then hit save at the bottom on of the form.

### Access tokens

Every time a user is given access to the system an access token/authPass is generated for them. This contains a list of access tokens with timestamps (allowing them to be logged in from different devices for example), their user id and a list of roles. All authentication is managed through this system of authentication passes.

Once a user logs in using the user system, the optional sessions module saves the token and userid as a cookie in the user's browser so that they can make repeated requests to the system without having to log in every time.

## Creating and managing entities

Content in Iris, from users to pages to menus, is based around a concept of entities.

Entities have fields for things such such as text, url paths and images. Entities themselves are stored in the MongoDB database while configuration for fields and entity types is stored in JSON files in your sites' configuration folder. 

### Creating and editing entity types

To create a new entity type (for example a blog, page or message), visit the entities section in the administration menu (or /admin/entities) and select the "Create new entity type" button.

You will be presented with a form to create your new entity type.

First pick a name for your entity type. This won't usually be shown outside of the administration system but it cannot be changed easily after creation.

##### Field types
 
* string_string - A simple text field for short lines of text.
* string_long - A long formatted, rich text field with a CKeditor text editor.
* string_file - A file upload
* ofstring_string - A field containing multiple simple text strings

##### Editing and creating entities

To create a new entity, visit the entities page in the administration toolbar and use the dropdown next to each one to create a new entity of that type.

To edit/delete entities of a type, select the "View content" option for an entity type. 

# Pages

A page entity type has already been created for you in the default distribution. To create/edit and delete pages visit the entities screen and under page either view content or create a new one.

## Page paths

To make a page appear at a path/url relative to your organisation simply put the relative path (with a leading slash) in the path field of the page entity. "/" on its own is the home page. 

# Basic templates and theming

Iris comes with its own templating language for embeded elements such as blocks, forms and menus but also uses and comes with support for Mustache and AngularJS templates. Other template languages can be easily slotted in instead.

## Theme location and structure

Themes are stored in the "themes" folder of a site (so sites/YOURSITE/themes/THEMENAME).

The default "Purple" theme has some basic page templates you can use to get started. The name of the theme folder is set in the main site configuration.json file.

## Static files

Static files can be placed within the "static" directory in the themes folder. This can include frontend JavaScript files, CSS files, static assets and others. 

The contents of this directory will be publicly available at /static

Note that uploaded files stored as part of the entites will not be stored in this folder but instead in the /files folder of the site folder.

## Templates

### Template naming

Iris uses a template lookup and override engine to find and process the right template from the theme folder, falling back to a relevant default template if no such template is present in the theme folder.

### Template extensions

Templates can be simple HTML pages but if you want to use a server-side templating system such as Mustache you should give them an extension based on this templating language. The setting for the extension itself is set in configurations.json .  .mustache files will be treated as mustache templates for example.

### The HTML wrapper template

Each rendered page is wrapped in a special template with a file beginning with HTML. This is where you can place the main HTML wrapper around which entity pages and others sit.


# API documentation

## Dependencies

Iris is built using Node.JS, uses Express for HTTP routing, Socket.IO for websockets and runs on a MongoDB database. The front end widgets are built using Angular.JS and the forms and admin interface are created using the JSONform library and bootstrap. Other Node.js module dependencies can be found in the package.JSON file and everything can be installed by running NPM install.

## Directory structure

The Iris directory structure is separated into four main areas.

### Core area

The first is the root directory that contains files crucial to the running of the system. These should not be edited or removed.

* __boot.js__ – This is run when the server starts and initiates the global C object and the global iris.modules modules objects that are used throughout the system. It runs through many of the other core files, loads modules and initiates the files launching the HTTP server, web socket server and the database. It is not run directly but run through a config file for a particular site (more on this later).
* __db.js__ – This loads in database schema files and models created by modules and through the entity management system and sets them up for use in the MongoDB database.
* modules.js – This file contains the parent objects all Iris modules are based on and defines all their functionality.
* __hook.js__ – This contains the core hook and event system functionality that is used by the module system.
* __server.js__ – This sets up Express.js and the HTTP server based on the settings provided in the configurations file on site start-up.
* __log.js__ – This uses Bunyan to create logs for viewing in the administration interface or elsewhere.
* __sockets.js__ – This initiates the Socket.IO web socket server and provides functions for creating socket listeners and sending socket events.
* __utils.js__ – This defines helper functions such as the translation system and the promise system that are used throughout.

### Core modules

The “core_modules” folder contains Iris modules (defined using the modules.js file) that are essential for the running of the system.

#### Auth
This provides a system for managing sessions, permissions, roles and verifying authentication details and creating access tokens.

#### Entity
This provides a system for creating, editing, deleting and searching for/fetching categorised database documents.

### Sites directory

The sites directory stores all the configuration for the current application instance, including database schema, module settings, permissions and server and database connection settings. It is also where the application itself is launched.

### Custom modules
Custom Iris modules can either be placed in the “modules” folder or installed regularly through NPM into Node_modules. They initiate as soon as they are included using the Node.JS require() function.

The sites directory contains an __enabled_modules.js__ file. This contains Node.JS require commands that load in custom or NPM modules using the Iris system. They need to be loaded at this point so that they get initialised properly.

## Site config file

A “defaults” directory is provided as an example site configuration. To make a new application, simply copy/rename this directory. The __settings.json__ file is where the settings for the application are placed. Here is a summary of these settings:

* __port__: The port the Node.JS web server runs on. (80 or 3000 for example)
* __apikey__: This is the administrator username/apikey. It should be kept secret.
* __secretkey__: An additional password used in combination with the secretkey to gain access to the system as an administrator.
* __https__: set to true or false depending on whether the site is running on HTTPS.
* __https_key__: System path to the SSL key if HTTPS mode is on.
* __https_cert__: System path to the SSL certificate if HTTPS mode is on.
* __db_server__: the server hosting the database (localhost for example).
* __db_port__: The MongoDB database port (27017 for example).
* __db_name__: The name of the MongoDB database used for this application.
* __db_username__: The username (if relevant) to be used when connecting to the database.
* __db_password__: The password (if relevant) to be used when connecting to the database.
* __theme__: The relative path to the current theme, if using __frontend__.
* __templateExtension__: The templating engine to use, if using __frontend__.

###Other files in the sites directory

Iris automatically creates directories inside a site’s folder for database schema, module configuration and logs. These can then be exported or saved through version control allowing for multiple sites to be managed using one core code base.

## Launch instructions

The Iris server is started with __launch.js__ in the root directory which can be run using Node.JS with a command line parameter specifying which site should be served. To start a site, run `launch.js site=sites/sitename`. This will run the site's own __launch.js__ file - meaning that should you want to restart the server, the host process can keep some persistent data. This initiates the server and database, loads modules and sets up the configuration folder and files.

## Core functions and variables

All the core functionality is stored in the C JavaScript object. This is frozen once it has been created so no additional properties can be added to it.

###Modules

#### iris.registerModule()

Use this function within a module file to register a new Iris module. This initates the module, assigns functions global to all modules and creates a configuration folder for that module in the sites directory.

```javascript

iris.registerModule("mymodule");

// This would create a /sites/yoursite/configurations/mymodule folder
// and a iris.modules.mymodule object where the module's functions can be accessed.

```

#### Module path variables

The module object contains some helper variables for getting the path of the module.

```javascript

iris.modules.mymodule.path // This returns the system path for the module
iris.modules.mymodule.configPath //This returns the path to the configuration folder for this module

```

#### iris.modules.*modulename*.registerHook()

Hooks are named event chains that run through the system when they are triggered. Modules register hooks, assign the hook a rank and then when an event with that hook name is fired, the ranked hooks with that name of all modules fire in order and pass data between each other in a chain.

To finish a hook successfuly, use ** thisHook.finish(true, *data to pass to next hook*); **

To finish a hook in failure, use ** thisHook.finish(false, *data to pass to next hook*); **


```javascript

iris.modules.mymodule.registerHook("entity_blog_save",2,function(thisHook, data){

  //Finish the hook and pass the data through to the next hook without doing anything to the data

  thisHook.finish(true, data);

})

```

#### iris.modules.*modulename*.globals

The iris.modules.*modulename* object for registered modules is sealed from editing to prevent it being accidentally destroyed or polluted. All custom variables and methods can be namespaced under the iris.modules.*modulename*.globals object and they will be available for any other module to use.

```javascript

iris.modules.mymodule.globals = {

  "hello": function(name){

    return "hello" +" "+ name;

  }

}

// In any module in the system

iris.modules.mymodule.globals.hello("Rachel"); // Returns "hello Rachel".

```

#### iris.modules.*modulename*.registerSocketListener()

Listen for a specific web socket message and run the function in the callback when the message is sent.

```javascript

iris.modules.mymodule.registerSocketListener("package", function(socket,data){

  socket.emit("received", data); //Sends the data back to the socket that sent it with a received message

})


```

###Entities

#### iris.registerDbCollection();

Register a database model name (a MongoDB collection) that is used for a specific entity type.

A database collection with the same name can only be registered once. Multiple modules can attach fields or write to this same database collection.

Database collections can also be created directly in the entity management user interface.

```javascript

iris.registerDbCollection("blog");

```

#### iris.registerDbSchema()

Associate fields (as Mongoose database schema) with a specific database collection. See the Mongoose documentation for more information. Additional fields for title and description are provided for the entity UI.

```javascript

iris.registerDbSchema("blog", {

  name: {
    type: String,
    title: "Blog title",
    description: "Blog title goes here",
    required: true
  },
  date: {
    title: "Publication date",
    type: Date,
    required: true
  }
});


```

### Authentication

#### The authPass object

When a user makes a request into the system an authPass is generated for them by the core Auth module. If they pass in a credentials object with either a userid and a token or a secretkey and apikey (for the administrator) these credentials are checked, otherwise the authPass returned is that for an anonymous user.

The authPass is automatically added to the Express.js req object under req.Authpass.  It contains the user's user id and their roles. It is used throughout the system when calling things such as hooks to check the permissions of a user.

```javascript

iris.app.get("/hello", function(req, res){

  console.log(req.authPass)  // returns {userid:1, roles: ["authenticated", "administrator"]} for example

  res.send("hello");

});

```

#### iris.registerRole()

Register a role to be used in the permission system. This instantly makes it visible and usable in the permissions user interface. How a role is assigned to a user is up to you and your module.

```javascript

iris.registerRole("contributor");

```

#### iris.registerPermission()

Register a permission to be used in the permission system. Permissions are categorised to make them easier to filter on the permissions administration page.

```javascript

iris.registerPermission("games", "can play games");

```

#### iris.modules.auth.checkPermissions()

Takes an authPass (see above), an array of permissions to check for and returns true or false depending on whether the user has that permission.

```javascript

  iris.app.get("/games", function(req, res){

  if(iris.modules.auth.checkPermissions(["can play games"], req.authPass){

    res.send("Go play outside");

  } else {

    res.send("can't play games");

  }

});


```

### Web sockets

Note: For registering web socket event handlers, look at the module documentation for iris.modules.*modulename*.registerSocketListener().

To broadcast a socket message to an array of users (current logged in users)

#### iris.sendSocketMessage()

Send a web socket message to an array of userids. “*” means send to all connected websockets.

```javascript

var greetingMessage = "hello";

iris.sendSocketMessage(["1","5","17"], "greeting", greetingMessage);

```

### Hooks

#### iris.hook()

Trigger a hook (or a series of hooks) registered by modules through iris.modules.*modulename*.registerHook. This returns a JavaScript promise with the result of the hook chain (whether it passed or failed).

```javascript

iris.hook("game_save", req.authPass, constants, variables).then(function (success) {

  res.send(success);

}, function(fail) {

  res.send("Game failed to send");

});


```

### Translations

#### iris.registerTranslation();

Register a translation of a string that is passed through the iris.translate function. The context is a condition function that is checked before the translation is run.

```javascript

iris.registerTranslation("hello %s", "hola %s, function(){

  return authPass.roles.indexOf("spanish");

});

```
#### iris.translate()

Pass in a string with placeholders for %s string, %n number and %j json. Provide these variables as the second and subsequent arguments. These are then placed in and also run through the translation system. Finally put in an authPass object that can be checked to see if translation contexts should apply.

```javascript

iris.translate("hello %s", "Michael", req.authPass);

```

### Global variables

* __iris.sitePath__ - The path of the current application’s sites folder.
* __iris.app__ - The express application, used for creating HTTP paths.

### Assorted global functions

#### iris.log.info iris.log.warn iris.log.error

Use this to record an entry to the system log.

```javascript

iris.log("info", "User" + userid + " " + "logged in");

```

#### iris.include()

Attempt to load a file from the one location (a user configuration directory for example), if it is not present, load from the default directory.

```javascript

iris.include(__dirname + "/group_types.js", iris.configPath + "/group_manager/group_types.js");

```

#### iris.promise and iris.promisechain

Helper functions for creating JavaScript promises functions wrapped in an error catching service.

iris.promise takes a function which passes through three arguments, a yes function for if the promise completes successfully, a no function for when it fails and a data object.

iris.promiseChain takes and runs through an array of promises, data to pass through and success and fail functions to use when the chain succeeds or fails.

```javascript

var promiseOne = iris.promise(function (_id, yes, no) {

    iris.dbCollections.message.findOne({
      '_id': _id
    }, function (err, doc) {

      if (err) {

        no("Database error");

      }

      if (doc) {

        yes(doc);

      } else {

        no(false);

      }

    })
);

var promiseTwo // another promise

var success = function(successData){

  iris.log("info", successData);

};

var success = function(failData){

  iris.log("info", data);

};

iris.promiseChain([promiseOne, promiseTwo], data, success, fail);

// Runs both functions, passes through the data
// then runs the success function if they both pass or the fail function if either of them fail.

```

#### Config reading/writing

```javascript

  iris.saveConfig({
    "hello": "world"
  }, "test/hello", "thisisatest", function () {

    iris.readConfig("test/hello", "thisisatest").then(function (output) {

      console.log("read", output);

    }, function (fail) {

      console.log(fail);

    });

  });

```

##Core module hooks

### Auth

#### hook_auth_authpass

Fired on creating an authPass, latch onto this hook to add items to the authPass object (such as roles)

```javascript

iris.modules.auth.registerHook("hook_auth_authpass",0,function(thisHook, authPass) {

  //Check if a user is in the editors array and add an "editor" role if yes.

  var editors = ["5","66", "77"];

  editors.forEach(function(editor, index){

    if(authPass.userid === editor){

      authPass.roles.push("editor");

    }

  });

  thisHook.finish(true, authPass);

});

```

#### hook_auth_maketoken

On receiving an object with a userid (data.userid for example), generates, returns and stores an access token for that user id. The access token can be modified by subsequent hooks.

```javascript

iris.modules.auth.registerHook("hook_auth_maketoken",0,function(thisHook, token) {

  //Add a timestamp to the token

  token.id += Date.now();

  thisHook.finish(true, token);

}

```
#### hook_auth_deletetoken

Provide an object with a data.userid and data.token and delete the specific token, if it exists. Once the initial event is fired it returns the userid the token was deleted for. Note that this hook also clears the user from the system's list of active users if the user has no tokens left.

#### hook_auth_clearauth

Provided with a userid it clears the user from the system and deletes all their access tokens.

### Entity

#### hook_entity_create

Takes a data.entityType and other data fields depending on the type of entity needing to be created.

#### hook_entity_edit

Takes a data.entityType and data._id of an existing entity along with any fields that need to be updated on the entity

#### hook\_entity\_validate
#### hook\_entity\_validate\_*entitytype*

Hook into this to check the contents of an entity that is being created or edited. The fields cannot be altered during this hook. It's meant for passing or failing validation. Alterations are done in hook_entity_presave

#### hook\_entity\_presave
#### hook\_entity\_presave\_*entitytype*

Change an entity being updated or created just before it's saved.

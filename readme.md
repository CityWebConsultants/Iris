# About

## Dependencies

____ is built using Node.JS, uses Express for HTTP routing, Socket.IO for websockets and runs on a MongoDB database. The front end widgets are built using Angular.JS and the forms and admin interface are created using the JSONform library and bootstrap. Other Node.js module dependencies can be found in the package.JSON file and everything can be installed by running NPM install.

## Directory structure

The ____ directory structure is separated into four main areas.

### Core area

The first is the root directory that contains files crucial to the running of the system. These should not be edited or removed.

* __boot.js__ – This is run when the server starts and initiates the global C object and the global CM modules objects that are used throughout the system. It runs through many of the other core files, loads modules and initiates the files launching the HTTP server, web socket server and the database. It is not run directly but run through a config file for a particular site (more on this later).
* __db.js__ – This loads in database schema files and models created by modules and through the entity management system and sets them up for use in the MongoDB database.
* modules.js – This file contains the parent objects all ____ modules are based on and defines all their functionality.
* __hook.js__ – This contains the core hook and event system functionality that is used by the module system.
* __server.js__ – This sets up Express.js and the HTTP server based on the settings provided in the configurations file on site start-up.
* __log.js__ – This uses Bunyan to create logs for viewing in the administration interface or elsewhere.
* __sockets.js__ – This initiates the Socket.IO web socket server and provides functions for creating socket listeners and sending socket events.
* __utils.js__ – This defines helper functions such as the translation system and the promise system that are used throughout.

### Core modules

The “core_modules” folder contains ____ modules (defined using the modules.js file) that are essential for the running of the system.

#### Auth
This provides a system for managing sessions, permissions, roles and verifying authentication details and creating access tokens.

#### Entity
This provides a system for creating, editing, deleting and searching for/fetching categorised database documents.

### Sites directory

The sites directory stores all the configuration for the current application instance, including database schema, module settings, permissions and server and database connection settings. It is also where the application itself is launched.

### Custom modules
Custom ____ modules can either be placed in the “modules” folder or installed regularly through NPM into Node_modules. They initiate as soon as they are included using the Node.JS require() function.

The sites directory contains an __enabled_modules.js__ file. This contains Node.JS require commands that load in custom or NPM modules using the ____ system. They need to be loaded at this point so that they get initialised properly.

## Site config file

A “defaults” directory is provided as an example configuration file. To make a new application, simply copy/rename this directory. The launch_default.js file is where the settings for the application are placed. Here is a summary of these settings:

* __port__: The port the Node.JS web server runs on. (80 or 3000 for example)
* __apikey__: This is the administrator username/apikey. It should be kept secret.
* __secretkey__: An additional password used in combination with the secretkey to gain access to the system as an administrator.
* __https__: set to true or false depending on whether the site is running on HTTPS.
* __https_key__: System path to the SSL key if HTTPS mode is on.
* __https_cert__: System path to the SSL certificate if HTTPS mode is on.
* __db_server__: the server hosting the database (localhost for example).
* __db_port__: The MongoDB database port (27017 for example).
* __db_name__: The name of the MongoDB database used for this application.

###Other files in the sites directory

____ automatically creates directories inside a site’s folder for database schema, module configuration and logs. These can then be exported or saved through version control allowing for multiple sites to be managed using one core code base.

## Launch instructions

Once the sites directory has been created, the launch_sitename.js (renamed launch_defaults.js) can be run using Node.JS. This initiates the server and database, loads modules and sets up the configuration folder and files.

## Core functions and variables

All the core functionality is stored in the C JavaScript object. This is frozen once it has been created so no additional properties can be added to it.

###Modules

#### C.registerModule()

Use this function within a module file to register a new ____ module. This initates the module, assigns functions global to all modules and creates a configuration folder for that module in the sites directory.

```javascript

C.registerModule("mymodule");

// This would create a /sites/yoursite/configurations/mymodule folder
// and a CM.mymodule object where the module's functions can be accessed.

```

#### Module path variables

The module object contains some helper variables for getting the path of the module.

```javascript

CM.mymodule.path // This returns the system path for the module
CM.mymodule.configPath //This returns the path to the configuration folder for this module

```

#### CM.*modulename*.registerHook()

Hooks are named event chains that run through the system when they are triggered. Modules register hooks, assign the hook a rank and then when an event with that hook name is fired, the ranked hooks with that name of all modules fire in order and pass data between each other in a chain.

To finish a hook successfuly, use ** thisHook.finish(true, *data to pass to next hook*); **

To finish a hook in failure, use ** thisHook.finish(false, *data to pass to next hook*); **


```javascript

CM.mymodule.registerHook("entity_blog_save",2,function(thisHook, data){

  //Finish the hook and pass the data through to the next hook without doing anything to the data

  thisHook.finish(true, data);

})

```

#### CM.*modulename*.globals

The CM.*modulename* object for registered modules is sealed from editing to prevent it being accidentally destroyed or polluted. All custom variables and methods can be namespaced under the CM.*modulename*.globals object and they will be available for any other module to use.

```javascript

CM.mymodule.globals = {

  "hello": function(name){
  
    return "hello" +" "+ name;
  
  }

}

// In any module in the system

CM.mymodule.globals.hello("Rachel"); // Returns "hello Rachel".

```

#### CM.*modulename*.registerSocketListener()

Listen for a specific web socket message and run the function in the callback when the message is sent.

```javascript

CM.mymodule.registerSocketListener("package", function(socket,data){

  socket.emit("received", data); //Sends the data back to the socket that sent it with a received message

})


```

###Entities

#### C.registerDbCollection();

Register a database model name (a MongoDB collection) that is used for a specific entity type.

A database collection with the same name can only be registered once. Multiple modules can attach fields or write to this same database collection.

Database collections can also be created directly in the entity management user interface.

```javascript

C.registerDbCollection("blog");

```

#### C.registerDbSchema()

Associate fields (as Mongoose database schema) with a specific database collection. See the Mongoose documentation for more information. Additional fields for title and description are provided for the entity UI.

```javascript

C.registerDbSchema("blog", {

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

C.app.get("/hello", function(req, res){

  console.log(req.authPass)  // returns {userid:1, roles: ["authenticated", "administrator"]} for example

  res.send("hello");

});

```

#### C.registerRole()

Register a role to be used in the permission system. This instantly makes it visible and usable in the permissions user interface. How a role is assigned to a user is up to you and your module.

```javascript

C.registerRole("contributor");

```

#### C.registerPermission()

Register a permission to be used in the permission system. Permissions are categorised to make them easier to filter on the permissions administration page.

```javascript

C.registerPermission("games", "can play games");

```

#### CM.auth.checkPermissions()

Takes an authPass (see above), an array of permissions to check for and returns true or false depending on whether the user has that permission.

```javascript

  C.app.get("/games", function(req, res){

  if(CM.auth.checkPermissions(["can play games"], req.authPass){
    
    res.send("Go play outside");
  
  } else {
  
    res.send("can't play games");
  
  }

});


```

### Web sockets

Note: For registering web socket event handlers, look at the module documentation for CM.*modulename*.registerSocketListener().

To broadcast a socket message to an array of users (current logged in users)

#### C.sendSocketMessage()

Send a web socket message to an array of userids. “*” means send to all connected websockets.

```javascript

var greetingMessage = "hello";

C.sendSocketMessage(["1","5","17"], "greeting", greetingMessage);

```

### Hooks

#### C.hook()

Trigger a hook (or a series of hooks) registered by modules through CM.*modulename*.registerHook. This returns a JavaScript promise with the result of the hook chain (whether it passed or failed).

```javascript

C.hook("game_save", data, req.authPass).then(function (success) {

  res.send(success);

}, function(fail) {

  res.send("Game failed to send");

});


```

### Translations

#### C.registerTranslation();

Register a translation of a string that is passed through the C.translate function. The context is a condition function that is checked before the translation is run.

```javascript

C.registerTranslation("hello %s", "hola %s, function(){

  return authPass.roles.indexOf("spanish");

});

```
#### C.translate()

Pass in a string with placeholders for %s string, %n number and %j json. Provide these variables as the second and subsequent arguments. These are then placed in and also run through the translation system. Finally put in an authPass object that can be checked to see if translation contexts should apply.

```javascript

C.translate("hello %s", "Michael", req.authPass);

```

### Global variables

* __C.sitePath__ - The path of the current application’s sites folder.
* __C.app__ - The express application, used for creating HTTP paths.

### Assorted global functions

#### C.log.info C.log.warn C.log.error

Use this to record an entry to the system log.

```javascript

C.log.info("User" + userid + " " + "logged in");  

```

#### C.include()

Attempt to load a file from the one location (a user configuration directory for example), if it is not present, load from the default directory.

```javascript

C.include(__dirname + "/group_types.js", C.configPath + "/group_manager/group_types.js");

```

#### C.promise and C.promisechain

Helper functions for creating JavaScript promises functions wrapped in an error catching service. 

C.promise takes a function which passes through three arguments, a yes function for if the promise completes successfully, a no function for when it fails and a data object.

C.promiseChain takes and runs through an array of promises, data to pass through and success and fail functions to use when the chain succeeds or fails.

```javascript

var promiseOne = C.promise(function (_id, yes, no) {

    C.dbCollections.message.findOne({
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

  C.log.info(successData);

};

var success = function(failData){

  C.log.info(data);

};

C.promiseChain([promiseOne, promiseTwo], data, success, fail);

// Runs both functions, passes through the data
// then runs the success function if they both pass or the fail function if either of them fail.

```

##Core module hooks

### Auth

#### hook_auth_authpass

Fired on creating an authPass, latch onto this hook to add items to the authPass object (such as roles)

```javascript

CM.auth.registerHook("hook_auth_authpass",0,function(thisHook, authPass) {

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

CM.auth.registerHook("hook_auth_maketoken",0,function(thisHook, token) {

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
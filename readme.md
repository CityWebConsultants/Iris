## User system

Iris comes with a user system which allows people to log in to your website/application and see/do different things depending on their role.

### Logging in

To log in to the administration system, visit /admin or /login and type in your access details.

### Logging out

To log out, either visit /logout or hit the logout button on the administration toolbar.

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

#### Checking permissions

To check a permission within a module use the iris.modules.auth.globals.checkPermissions function. This takes an array of permissions and an authPass to check against. It returns true or false.

```

if (iris.modules.auth.globals.checkPermissions(["my permission"], thisHook.authPass)) {

// This is run if the authPass has the "my permission" permission.

}


```

### Access tokens

Every time a user is given access to the system an access token/authPass is generated for them. This contains a list of access tokens with timestamps (allowing them to be logged in from different devices for example), their user id and a list of roles. All authentication is managed through this system of authentication passes.

Once a user logs in using the user system, the optional sessions module saves the token and userid as a cookie in the user's browser so that they can make repeated requests to the system without having to log in every time.

## Creating and managing entity types and entities

Content in Iris, from users to pages to menus, is based around a concept of entities.

Entities have fields for things such such as text, url paths and images. Entities themselves are stored in the MongoDB database while configuration for fields and entity types is stored in JSON files in your sites' configuration folder.

### Creating and editing entity types

To create a new entity type (for example a blog, page or message), visit the entities section in the administration menu (or /admin/entities) and select the "Create new entity type" button.

You will be presented with a form to create your new entity type.

First pick a name for your entity type. This won't usually be shown outside of the administration system but it cannot be changed easily after creation.

Then add fields to the entity type. Different field types have their own settings but every field has the following settings:

* __Field title__ - The system title of this field. This should only be set once as it's what is stored in the database.
* __Label__ - The name of the field as it appears to a user on the edit/create entity forms
* __Field description__ - Appears next to the field in the edit/create forms
* __Required__ - is this field required?
* __Can view of the client side__ - A permissions form showing whether a user of a certain role is able to see this field. If they can't it will be automatically stripped out when an entity is fetched/viewed by them. Users of the admin role can see all fields.

##### Editing and creating entities

To create a new entity, visit the entities page in the administration toolbar and use the dropdown next to each one to create a new entity of that type.

To edit/delete entities of a type, select the "View content" option for an entity type.

##### Viewing entities

If an entity has a "path" field it can be viewed directly at the path specified in this field.

Any entity can also be viewed at the address /entityType/entityID

For example:

```
/page/1

```

Would show a page with the entity ID of 1.

## Configuration diff, export and import

Configuration in Iris covers things like blocks you have created, menus, entity types and permissions. All configuration is in JSON format.

So that you don't accidentally overwrite changes you have made live on a server by uploading new configuration it is stored in two directories.

* Configuration
* Staging

The configuration directory and its sub folders (usually named after the module that provides the configuration) stores the live configuration that is being used by the site/application. If you make a change in the administrative interface it will automatically be pushed into this folder.

The staging directory is for saving to a version control system and importing to another instance of your site when deploying/developing.

You shouldn't need to add your live configuration folder to your version control system.

Moving configuration between these two folders can be done through the administration interface under the config option in the menu.

To move all your live configuration to the staging folder hit the export config button. To import any configuration in the staging folder into your live configuration folder hit the import config button.

The configuration user interface also comes with a system for seeing which files are different between these folders and for seeing the differences between them in a graphical diff. Any files that are different will show at the top of the configuration screen. To view what is different press the view diff button.

## Logs

The logs page shows any messages that the system has reported including logs when an entity has been created, edited or deleted, when the server has been restarted and error messages generated by the system.

The logs are all stored as JSON in the logs folder of your site's folder within the home/sites/YOURSITENAME/logs directory.

The logs are colour coded based on their level. The available log levels are:

* trace
* debug
* info
* warn
* error
* fatal

To log within an Iris module use the iris.log() function. For example:

```
iris.log("info", "a page was created")

```

To clear the logs, delete the log file in the logs directory. A new one will be created and written to.

## Text filters/formats

The text format section of the administration menu can be used to select which HTML elements and attributes are allowed to be used in a field. Once created the filter can be added to a long text field in the entity type create/edit interface. Any HTML element or attribute not allowed by a text format will be wiped out before the entity is saved to the database.

List attributes and elements by commas. Don't put in opening or closing brackets.

Example:

```
H2, P, B

```

## Actions

The actions module allows you to trigger actions that happen when a specific event and specific conditions occur.

Actions have to be triggered by events. Events provide variables that can be used in conditions.

For example, the __page visit__ action provides the variables __[url]__, __[userid]__ and __[roles]__ referring to the path that was visited, the userid of the user visiting the page and a list of roles they have.

You can use these in the conditons section of the actions interface by pasting in the token (including the square brackets).

For example, if your condition is __[url] is /news__ the action would only fire if the page /news was visited.

Actions themselves, for example a log action also take parameters. For example a log action would take the log type (error, info...) and the log message. The variables from the event can also be used in this part of the form.

### Actions API - defining events in modules

Registering an event in a custom module is done by calling a simple one line function that defines white name of the event and an array of variables it provides.

For example:

```JavaScript
iris.modules.actions.globals.registerEvent("page_visit", ["url", "userid", "roles"]);

```

### Actions API - triggering events in modules

To trigger an event within an Iris module, run the Actions module's triggerEvent function. Passing in the name of the event, the authPass for the user triggering the event and an object containing the variables listed when the event was defined.

```JavaScript

  iris.modules.actions.globals.triggerEvent("page_visit", thisHook.authPass, {
    "url": thisHook.const.req.url,
    "userid": thisHook.authPass.userid,
    "roles": thisHook.authPass.roles.join(",")
  });

```

### Actions API - defining actions in modules

To define an action you will first need to create a JSON schema for a form (see form system documenation or the JSONform docs). This is the form that will be presented in the actions user interface. This form is for putting in the parameters that this action takes.

The registration of the log event looks like this:

```JavaScript

iris.modules.actions.globals.registerAction("log", {

  message: {
    "type": "textarea",
    "title": "Message",
    "required": true
  },
  level: {
    "type": "text",
    "title": "Log level",
    "required": true,
    "enum": ["error", "info"]
  }

});

```

### Actions API - Acting on actions

Once an API action has been registered, if it is successfuly triggered by a action set a hook fires passing in any parameters that have been passed to the action.

__thisHook.const.params__ stores the parameters of the action.

The log action, for example, looks like this:

```JavaScript

iris.modules.actions.registerHook("hook_action_log", 0, function (thisHook, data) {

  iris.log(thisHook.const.params.level, thisHook.const.params.message)

  thisHook.finish(true, data);

})


```

As it is an ordinary hook (see the hook system documentaion), responses to actions can be chained into multiple actions.

## Websockets

### Registering websocket listeners in an Iris module

An iris module's registerSocketListener function can be used to listen to a socket event. It takes the name of the socket event to listen for and a callback function which contains both the socket calling it and the data in the original socket event.

```javascript

iris.modules.mymodule.registerSocketListener("myMessage", function(socket,data){

  socket.emit("received", data); //Sends the data back to the socket that sent it with a received message

})

```

### Sending socket messages to users

The iris.sendSocketMessage function can be used to send a message to a list of user ids or all connected users.

This takes three parameters.

* An array of userids. The string "*" is a wildcard that sends to all users.
* The name of the socket message to send.
* Data to send with the message.

```
iris.sendSocketMessage(["*"], "entityCreate", data[0]);

```

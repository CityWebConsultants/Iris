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

## Blocks

Blocks are reusable elements that produce HTML and can be slotted into a region in a theme. 

The initial distrubution of Iris comes with the following types of block, each provided by an extra, optional module.

Blocks can be created via the admin system by going to structure > blocks.

If you do not want to use the region system you can simply add a block to an HTML template with a block embed code.

For example:

```
[[[block blockname]]]

```

### Custom blocks

Custom blocks are allow you to insert custom text/HTML into your theme. 

### Menu blocks

Select a menu (after creating one using the menu system) and create a block using it for an easy way of adding a menu to your theme.

### Views

Views allow you to make a formatted lists of entities of an entity type, filtered and limited to your specification and add it to your theme. If using the angular_live_load module and socket.io they can also automatically refresh this list if an entity is added, deleted or edited.

To create a view:

* In the blocks window select the block type for the entity type you wish to create a list of.
* Give it a title and a limit of how many entities you wish to show (0 is no limit).
* Add conditions for when a field has or contains a certain value.
* Add a list of fields to show, in order and give them wrapper CSS classes and elements.
* Select if the field should strip HTML tags or not from its output.

## Adding blocks to regions

Regions are elements in a theme that contain a list of instances of a block type.

Once you have created some block instances from the available block types (see the blocks section) you can add them to a region in your theme using the form on the regions page within the structure section of the administration system.

Each block has a path visibility section. This uses the minimatch system to list (each on a new line) the paths the block is visible at on the site. Full documentation on how this works can be found on the Minimatch project page at https://github.com/isaacs/minimatch .

Which regions are available depends on the contents of the theme.json file in your theme folder. To add a new region, add it to the region section o that file.

### Adding a region to your theme

To add a region to your theme, use a regions embed code giving it your region name. For example:

```
[[[region regionname]]]
```

## Menus

Menus are lists of links and sublinks that can be used for navigating through your site.

To create a menu, go to the menu interface in the structure section of the administration toolbar.

Hit edit next to an existing menu or create a new one by selecting the create new menu button.

### Embedding menus in a theme

To embed a menu in the theme either use a menu block if the menu block module is enabled or use a menu embed template in an HTML template:

```
[[[menu menuname]]]
```

### Theming menus

The default menu.html template can be found in the menu module's template folder. iris_core/modules/core/menu/templates/menu.html

This can be overriden by a theme or module (for more informaton look at the template naming and lookup documentation).

The menu template lookup also takes an additional parameter of the menu name so you can create a template for a specific menu using menu_menuname.html

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

## Restarting the server

Whenever you change the JavaScript code of a module or enable or disable a module you will need to restart the node.js process. This does not apply to changes made to template, theme and configuration files.

Sessions are persistent after using the restart function, so no one who is logged in will be logged out when you restart.

To restart the server go to the restart page in the administration toolbar and hit the restart button. Your site will not be available while the restart takes place but it should be a process taking at most a few seconds.

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

## Creating modules

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

### Defining functions and properties of a module

When a module is created and enabled it is automatically added to the global iris.modules object.

For example: iris.modules.mymodule

This object has the following properties.

* __path__ - fixed, non-editable path to the module's folder
* __registerSocketListener__ - allows a module to register a websocket listener. See the documenation on websockets.
* __registerHook__ allows a module to register a hook (see the documenation on the hook system)
* __globals__ - An object for a modules custom properties and functions. This is the only part of a module that is directly writeable. It is also accessible by other modules. For example _iris.modules.mymodule.myfunction()_

Modules can also have their own package.json files for defining dependencies. These dependencies are installed into the root node_modules folder when calling the root _NPM install_. See node.js/npm documenation for information on writing package.json files.

## Templating

Iris uses a combination of Handlebars (http://handlebarsjs.com/) templating and its own embed language. Normal HTML, JavaScript and CSS is fine as well. Handlebars information will not be repeated here so please look at the Handlebars documentation for that.

### Using other templating languages

You can slot in any other templating language after these such as client side Angular js or React templates as long as they don't clash with the delimeters of the handebars or Iris templates. So you will have to use something other than curly or square brackets. Most templating languages allow you to pick custom delimeters to avoid clashes.

### Seeing available Handlebars variables

An easy way of seeing which handlebars variables are available for you to use the following Handlebars snippet:

```
{{#each this}}
{{@key}}
{{/each}}

```

### The "{{current}}" variable

When viewing an entity page directly through its path, a handlebars variable of _current_ will be made available. The fields visible on this will depend on the field view permissions of the current user viewing the page. 

### Iris embed codes

Iris embed codes for items such as blocks, regions, forms and fetched entities always take the form of a pair of triple square brackets. The first item inside these square brackets is the type of embed you are using. Some examples:

* block
* file
* form
* region
* entity
* menu

Modules can provide their own embed codes.

#### Passing parameters to iris embed codes

Following the type of embed and a space you can pass a list of parameters to an embed code separated by commas.

##### Examples

The following embeds the admin toolbar on a page (if the person is allowed to view it):

```
[[[menu admin-toolbar]]]
```

The following code is used in the admin system to embed a block edit form for a block called myExampleBlock 

```
[[[form blockForm,myExampleBlock]]]

```

## Entity fetch embeds

To embed an entity or list of entities on a page you can use a special Iris embed template which look something like:

```
[[[entity page,myVariable,title|contains|"hello world",5,Title|asc]]]
```

The first parameter is the type of entity you are fetching. Multiple entity types can be specified separated by + signs (page+blog for example).

The second parameter is the name you want to give to the variable that stores the list of fetched entities. Once fetched this variable will be available in Handlebars.

The third parameter is an optional list of conditions (separated by + signs) for whether to fetch the entity. This takes the form of a field followed by a pipe character followed by an operator of the following:

* is
* notis
* contains (for text searches)
* notcontains 
* includes (for checking if a list contains an item)
* notincludes

then comes another pipe, followed by the value to check the field and operator against.

The next parameter is a limit of how many items to fetch.

Then comes a sort which takes the form of a field name a pipe character and "asc" for ascending and "desc" for descending.

Going back to the previous example:

```
[[[entity page,myVariable,title|contains|"hello world",5,Title|asc]]]
```

Would make the {{myvariable}} handlebars parameter contain, if they exist, up to 5 pages whose title contains the words "hello world". Only entities a user is allowed to view are displayed, along with only suitable fields.

### Using results of entity fetch embeds on the client side

If you want to use any fetched entities on the client side (in Angular or React templates for example) they are automatically made available for you.

After using an entities embed you will find an __iris__ object which contains a fetched sub object.

Within this object you will find a list of the entity fetching variables. For example

iris.fetched.myVariable would contain an array of fetched and sorted entities. 

#### Live updating via websockets

If you include the client side socket.io library on your page, whenever this entity list is updated (an entity is deleted, edited, created), the client side variables will automatically update.

##### The angular live load module 

Enabling the Angular Live Load module will allow you to use angular.js templating for entities that automatically updates on database changes.

You will need to include Angular.js and the Angular Live Load client file over at __/modules/angular_live_load/angular_live_load_client.js__

As Angular template notation clashes with handlebars, this module uses double ## symbols as a template delimiter.

Use HTML elements running "iris-template" controllers and ng-template attributes to load a specific entity fetch variable.

For example:

```HTML

<ul ng-controller="iris-template" ng-iris-template="myVariable">

<li ng-repeat="page in data">
##page.title##
</li>

</ul>


```

##### Bypass HTML sanitize in Angular templates

This list of page titles will update automatically.

To allow HTML in your template, the angular_live_load module comes with a helper HTML filter.

For example:

```
<div ng-bind-html="page.body | html_filter"></div>

```

## The hook system

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

## The form system

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

### Registering a custom page in a module

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

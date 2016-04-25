# Iris

Iris is a modular content management system and web application framework built using Node.js and MongoDB. 

After a year of keeping it to ourselves, we'd love for you to try out Iris, let us know what we've done right and wrong and help us build it by contributing to its source code via pull requests and by building modules and themes.

## Quick start

You'll need Node.js and MongoDB. After you've got them:

* Install iris via npm

```
npm install irisjs
```

* Create a launch file in the directory you launched from. Call it something like `mysite.js`. In this file, require the `irisjs` module and pass in some configuration options. For example:

```JavaScript

var config = {
  "sitePath": "/mysite", // this is where your configuration and templates will go 
  "port": 4000, // the port the site will run on
  "https": false, // using SSL?
  "https_key": "", // see above
  "https_cert": "", // see above
  "db_server": "localhost", // where is the MongoDB database running?
  "db_port": 27017, // which port is the database running on?
  "db_name": "test1", // what do you want the database name to be?
}

require("irisjs")(config);

```

* Run this file using node.js:

```
node mysite.js
```

* Visit `localhost:4000` or wherever you ran the site from.

[Look at the Iris documentation for more details](https://github.com/CityWebConsultants/Iris/wiki).

## Key features

* [Admin interface](#admin-interface)
* [Permissions and roles](#permissions-and-roles)
* [Extensible modules and themes](#modules-and-themes)
* [Built on an extensible Hook system](#hook-system)
* [Entity and field management](#entity-and-field-management)
* [Blocks and regions](#blocks-and-regions)
* [Use your favourite frontend framework with fallback to server-loaded HTML.](#progressive-enhancement)
* [Automatic live loading/updating of content](#live-loading-and-updating)
* [A JSON based form system](#form-system)
* [Registering actions to trigger after certain events](#triggers)
* [HTML filters to strip out/allow specific attributes and elements](#text-filters)
* [A full log page and system](#logging)
* [Database entity queries through simple widgets placed in HTML.](#entity-queries)
* [Simple export and import of configuration.](#made-for-version-control)
* [Built using and for Windows, Linux and Mac OS.](#operating-system-support)

### Admin interface

Almost everything in Iris aside from making your own modules and themes can be done in its own admin interface. Manage entities, entity types, fields permissions, actions to trigger when a condition is met, organise blocks and regions and a lot more.

### Permissions and roles

Iris comes packaged with a session management and authentication system that shows users only what you want them to see. This includes stripping out specific fields from content for some people and showing them the rest. All manageable through the admin interface and easily extensible using the API. Anonymous, authenticated and admin roles are built in. Add your own with one line of code and they'll be instantly usable throughout the system.

### Modules and themes

Iris is modular, in fact, most of its functionality is made up of core Iris modules (we've put in a few inessential extra ones for you as well). Want to add a feature, simply write a Node.js module using the Iris hook system and API and use and distribute it as you want.

Themes are even simpler.  Handlebars templates are built in on the server side but you can use any front-end framework you want while using our own embed helpers for things like forms, blocks, menus, regions and entity loading. Iris uses a cascading template look up system allowing you to easily override any HTML file in your own theme. Themes can even have parent themes so you can build something while taking advantage of a base layer.

### Hook system

So you really like a form that someone's made for Iris but you want to change something on it. You don't want to hack away at their module code. The Hook system almost every part of Iris is built on makes this sort of thing really easy. Let's take a look:

``` JavaScript

iris.modules.mymodule.registerHook("hook_form_render__someform", 0, function(thisHook, form){

  form.schema.title = {
  
    "type": "text",
    "description": "Just changing the form field description a bit"
    "default": form.schema.title.default
  
  }
  
  thisHook.pass( data);

})

```

And it's overriden. Changing rendering information, acting on system or user events, changing data mid-way through a process... the Iris hook system was made for module makers to be able to change whatever they need to without hacking around with other people's files.

### Entity and field management

Entities are pieces of content stored in the database (pages, blogs, messages in a messageboard and users for example). You can make entity types, add fields to them and then add, edit and delete entities all through the user interface. Access control, field rendering and templating is all there for you to use  once you get your entities made.

### Text filters

Want to only allow certain HTML elements or attributes? Register a text filter and re-use it on different entity types to strip out any unwanted HTML.

### Blocks and regions

A block is a piece of content that renders on a page. They can be placed (via the admin interface) in an Iris theme's regions (header, sidebar...) Iris modules can register block types. We've put in two such modules to get you started:

#### Custom block

A simple piece of template HTML.

#### List block

Pick an entity type, list some conditions you want to display (where the title contains "Hello" maybe?), pick which fields you want to display, add HTML classes and elements around them and hit save in the UI. You have a list block. Oh, and if you enable the Angular Live Load module it will automatically update when new content fits the criteria. Without a page refresh.

### Progressive enhancement

Iris should work perfectly with any frontend framework you throw at it. Pick React, Angular or anything else but spare some time for those users with slow connections or JavaScript disabled, or those users that are in fact search engine crawelers. Iris renders whatever you want on the server side while pushing variables for loaded entities into the client side JavaScript. It's the best of both worlds.

### Live loading and updating

Put in the clientside socket.io library on a page with an entity embed on it and a client side entity database will update whenever relevant entities are updated, edited or deleted. Perfect for live uploading templates. So much so that we packaged in an Angular Live Load module that does just this. You don't have to use that module though, as the data is readily available in plain JavaScript variables regardless, ready for you to use in whichever way you want.

### Form system

Want to create a form for your Iris module? Simply create a schema using the specifications of the JSON Form library, latch onto the Iris form render hook and it'll render and appear. You'll probably want a submit handler too to manage results, validation and redirects. There's a hook for that as well.

### Triggers

Want to send an email when a user visits a certain page and they have a certain role or userid? The triggers module lets you do this and more. You can even use text tokens provided by an event (different events provide different tokesn) as variables in an action.

The triggers module is most powerful when in the hands of a module developer as they can register new actions and events for others to use in their applications and sites. 

### Logging

Iris comes with a multi-level logging system with a colour coded log screen. Write logs with one line of module code or even use the triggers module user interface to write new logs automatically when something happens.

### Entity queries

Want to insert a list of an entity types (or several) on a page? Don't worry about writing database queries. Iris comes with an entity embed code system that not only loads in the entity ready to be used in Handlebars (or on the client side as a JavaScript varaible including live loading via websockets). Here's an example:

```

[[[entity page,pageList,title|contains|"hello",5,title|asc]]]

```
This would make a new handlebars variable called pageList available which you can use in the same template to get any entities successfuly fetched by the query inside (up to five containing the "hello" in the title). The variable for those entities would also be added on the client side for you to use in React, Angular or any other front end JavaScript. Slot in socket.io and it will update automatically when something in the database has changed.

### Made for version control

Iris was built with version control in mind so, instead of storing blocks, regions, fields and entity types, views and other configuration in the database, all configuration you'd want to put through Git or another version control system is stored in easily exportable/importable JSON files. You can see if and what has changed through the graphical interface. You can even edit these configuration files manually if you want as they're written to be human-readable. The exporting and importing is again done through the user interface, though if you prefer drag and drop exporting and importing you can do that too.

### Operating system support

Iris was made using computers running Windows, Linux and OSX. It should run on all three.


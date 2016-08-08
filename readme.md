# Iris

Iris is a modular content management system and web application framework built using Node.js.

## Key features

* Admin interface for creating entity types (content types) and adding fields
* User, permission and role system managed through the user interface
* Entity type reference system for categorising and tagging content and more.
* Themes, blocks, regions and an easy to use template system powered by Handlebars
* Forms that can be embedded straight into templates and created with easy to write JSON form schema.
* Content feeds and lists can be pulled in directly into a template with an in-template database query system and automatically live update when new content is added or content is changed/deleted.
* Built with progressive enhancement in mind so forms and content feeds work without client side JavaScript.
* A user interface for creating and editing menus.
* Clean templating which leaves you in full control of how you write your markup. Content can even be easily loaded into a liveupdating clientside JavaScript database for use with Angular, React or other frameworks.
* Register actions to do things such as send emails or make HTTP requests when something happens like a page is visited or content is created. All through the admin interface.
* A database abstraction layer for use with your choice of database (support for NeDB and MongoDB built in)
* Built for use with version control with simple export and import of JSON configuration. No configuration is stored in the database, keeping content and config completely seperate.
* Reusable HTML filters to strip out tags or attributes on content types.
* Includes a full REST API for dealing with content and authentication externally.
* Built on a hook and module system that allows easy creation of new modules (there's a hook for almost everything) to bring in new features or change existing ones. Any npm module can also be easily slotted in to work with your site.
* A built in text-translation system for multilingual support
* A log page to view system status and error messages

## Quick start

* Install iris into a directory via npm

```
npm install irisjs
```

* Create a launch file in the directory. Call it something like `mysite.js`. In this file, require the `irisjs` module and pass in some configuration options.

Here's an example of using the neDB database built into Iris. This is a quick way to get started.

```JavaScript

var config = {
  "sitePath": "/mysite", // this is where your configuration and templates will go 
  "port": 4000, // the port the site will run on
  "dbEngine": "nedb" // using neDB a database bundled in with Iris (MongoDB is also supported),
  "siteEmail": "you@yoursite.org",
  "max_file_size": 10 // Max file upload size
}

require("irisjs")(config);

```

Here's an example to use with a MongoDB database

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

```


* Run this file using node.js:

```
node mysite.js
```

Any of the configuration settings above can be overwritten by passing them as parameters to this launch file for example `node mysite.js port=5000`

* Visit `localhost:4000` or wherever you ran the site from. You should be greeted by a form to create your first user account.

* From then on visit `/admin` to access the administration interface

## Basic guide for site builders

This guide is intended for front end developers and does not include anything about the behind the scenes API. Developers should consult the GitHub hosted wiki (https://github.com/CityWebConsultants/Iris/wiki) for information about creating modules, extending Iris, creating forms, hooking into content displays and more.

### An example .gitignore file

Iris is very well suited for version control. In the `/admin/config` section you will find a way of exporting your configuration (entity types, permissions etc) to a `staging` folder or importing it from a staging folder. Here is a recommended .gitignore file to put in your project. The nedb folder is if you are using the nedb database as that is where the actual entity content is stored.

```

iris/logs
iris/files
iris/nedb
iris/local
iris/configurations
node_modules

```

### Iris modules

Iris modules can be enabled via the `/admin/modules` page. Iris comes with lots of modules to get you started and can easily be extended with more.

### Creating entity types

In the admin menu, visit the structure -> entities section in the admin menu (enable the `entity ui` module in the modules page of the administration interface first if necessary) and select `create entity type` to create a new entity type. Alternatively, select an existing type and select manage fields.

You will be able to reorder and add fields to an entity. When choosing a field, the plural names of fields are those which allow multiple pieces of information (multiple dates for example) to be added to an entity.

For long text fields, head to the widget tab to enable the CKEditor WYSIWYG editor for a field.

Once done with adding all of your fields go to the content screen and start creating content. Your fields should be available to edit.

Each piece of content automatically has a `path` field which is used if you want the entity to be accessed via a custom url. Every entity is automatically accessible via the `/entityType/entityID` path for example `/page/1`. To set a home page, use the `/` path.

## Changing permissions

Before anyone can see your content you'll need to allow them to do so. Head over to the users -> permissions screen to edit permissions so that anonymous users can view content of the `page` type for example.

## Creating a theme and templates to display content

Iris comes with a basic theme for the page content type but you will mostly want to create your own. Here's how:

* Create a folder in your site directory (specified with the `sitePath` configuration parameter) called `themes`.
* In this directory, create a subdirectory with your theme name. `myTheme` for example.
* In the `myTheme` directory, add a file called `myTheme.iris.theme` (change the myTheme part for whatever you named your theme).
* Add two directories to your theme `templates` and `static`.
* Add the following JSON configuration to the theme:

```JSON

{
  "name":"My theme", 
  "regions":["header","content","footer"]
}

```

* Visit the themes tab in the Iris menu and select your theme.

### Creating some template files

Every template in Iris is a simple HTML file that is parsed through the Handlebars-powered template engine. When Iris searches for templates it looks for them in module and theme template folders passing in a few search arguments.

If looking for a template to display a `page` entity, Iris looks for templates named `page.html` .  It also passes in the entity ID so you could easily override a template for a page with `page__1.html`. General entity pages (if no other template is found, can be stored at `entity.html`).

Error pages take the name of their status code, so use `404.html` for a 404 page.

Any system templates provided by modules can be overriden in your theme (you could even replace the whole admin theme if you wanted to).

#### The HTML wrapper template

A special template file called `html.html` is used for the wrapper of the page (everything that goes around it). This can also be overriden for more specific templates, `html__page__1.html` for example.

For the wrapper template to work it needs to include a special tag of `[[[MAINCONTENT]]]` . Put this wherever you want the inner template markup to display.

It is also wise to include the following markup for any messages that dispaly to a user:

```
{{{iris embed="messages"}}}

```

And the following in the `<head></head>` to include any clientside scripts or stylesheets loaded by an Iris module.

```
{{{iris embed="tags" name="headTags"}}}

```

#### Including custom templates within other templates 

You can also embed arbitrary templates using the same lookup system directly in templates by using the following tag:

```
{{{iris embed="template" template="sidebar__$current.enityType__$current.id"}}}
```

This would look for a sidebar.html template but also a `sidebar__page__1` template or `sidebar__page` template if available. The `$` sign infront of a parameter inside the embed allows you to use a variable from the Handlebars scope. The `current` variable is the current entity you're on the page of.

### Using Handlebars

For full information about Handlebars, use the Handlebars documentation at http://handlebarsjs.com . Iris also includes the Assemble Handlebars helpers library documented at https://github.com/assemble/handlebars-helpers

This documentation will only mention the tags specific to Iris.

#### Global template variables

##### {{current}}

Use the `current` Handlebars variable to get the entity currently being viewed. Only fields available to the client will be visible so make sure you check their permissions on a field and entity type level.

To print a title and body for example

```HTML
<h1>{{current.title}}</h1>

{{{current.body}}}

```

Not the triple brackets around the `current.body` tag, allowing it to contain HTML.

##### {{req}}

The full node.js request object is passed down to your templates to play with if available. This includes query strings passed to the url (useful for pagination and other arguments) and the user's ID if logged in. View the express.js and node.js documentation for more information about what you can find here.

#### Special Iris embeds

Iris contains lots of its own embed types all preceded by `iris` in the Handlebars tag. You've seen the `messages`, `tags` and `template` embeds already.

##### Iris embed parameters

Many Iris embed types take extra parameters. These can be passed in the following ways:

* A simple text parameter `param1="hello"
* A parameter based on a handlebars variable in the current scope `param2 = current.title`
* A JSON parameter `param3='{"type":"hello"}'
* A JSON parameter with a variable inside it (from the current scope) preceded by a dollar sign `param4='{"type":"$current.title"}'`
* A single `embedOptions` JSON parameter with all the values you want to pass ` embedOptions='{"title":"hello", "world":true}' `

##### Entity embeds

Entities and lists of entities that aren't the currently viewed entity can be loaded into any template. Relevant permissions are checked for the current user.

The entity query system takes the following parameters:

* entities - an array of entity types look through
* limit - how many to fetch
* sort - a JSON object of a field name and `asc` or `desc`. For example `{"title":"asc"}`
* skip - how many to skip. An offset. Useful in pagination.
* queries - an array of JSON objects containing the following keys
  * field - which field to query
  * operator - IS, CONTAINS, INCLUDES
  * value - the value to check through the operator
* liveupdate - true or false depending on whether to live update the embed whenever an entity in the fetched list gets updated or a new one is added.
* loadscripts - true or false depending on whether to load clientside scripts that put the entities (and their live loading) into a clientside database for use with systems such as Angular or React. The variableName parameter is there to give the clientside database collection for the embed a human-friendly name.

Here's an example:

```HTML

{{#iris embed='entity' variableName='myEntities' loadscripts=true liveupdate=true entities='["comment"]' queries='[{"field":"title","operator":"contains","value":"hello"}]' as |list|}}

  {{#each list}}

    {{this.title}}

  {{/each}}

{{/iris}}

```

##### Tag embeds

Tags have a `name` parameter for the tag container name and an exclude parameter that takes a JSON array of tags to exclude from the container (for example if you are already loading in jQuery and don't want it to be loaded in twice). Most of the core Iris application uses the headTags container but other modules may include other containers.

```HTML

{{{iris embed='tags' name='headTags' exclude='["socket.io"]'}}}

```

##### Forms Embeds

Forms each need a formID parameter. Any other parameters will be passed into the form render hooks. More information about forms can be found in the developer wiki.

```HTML

{{{iris embed="form" formID="login"}}}

```

##### Menu

Menus take a `menu` parameter and an optional `template` parameter that can override the menu template. Menus can be created in the user interface.

```HTML

{{{iris embed='menu' menu="admin_toolbar"}}}

```

### Template

Template embeds simply take the template lookup you want to use to embed a template.

```HTML

{{{iris embed='template' template="sidebar"}}}

```

-----------

For more information about all aspects of Iris, visit the developer wiki at https://github.com/CityWebConsultants/Iris/wiki

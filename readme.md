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
  "dbEngine": "nedb" // using neDB a database bundled in with Iris (MongoDB is also supported)
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

* Visit `localhost:4000` or wherever you ran the site from. You should be greeted by a form to create your first user account.

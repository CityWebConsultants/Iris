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



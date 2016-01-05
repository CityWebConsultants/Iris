# Theming & Frontend

## Overview

Iris has a powerful theme layer that creates markup from template files. Modules include templates which can be overridden - replaced - by the currently active theme to customise the display of content.

It is also simple to add custom CSS and JavaScript to a theme and include it where needed.

## Setting the active theme

The active theme is set as a parameter in a site's `settings.json` file, called `theme`. This should be set to the theme name.

## The theme folder

A theme is packaged up as a folder. The name of the folder is the name of the theme. So, to install themes, place them into the `home/themes` directory. A base theme is bundled with Iris and should be useful to work from when creating a new one.

### Structure of a theme

Theme folders contain three parts.

* __static folder__ - Everything in this folder will be accessible directly through a URL. It's for CSS files, image files such as logos and front end JavaScript files for your theme. Anything in this directory will be accessible under: `yourappurl/theme/static/`
* __theme.json__ - This file is the configuration for the theme you are using. It currently contains a list of regions. These are the regions supported by the theme that you can put blocks into. You can override the setttings in this file by putting your own theme.json file in your site's folder inside the home/sites directory. See the **Adding blocks to regions** section below for more information on regions.
* __templates__ folder. This is where HTML templates (including Handlebars template code) are stored. See **Template lookups, naming and overrides** section for more inforamtion about how templates work.

## Template lookups, naming and overrides

Theming in Iris works using a system of template lookups and overrides. Markup is generated from templates that include Handlebars variables and *embeds*, a type of directive written using a triple-bracket notation, like [[[example embed]]]. Default templates are provided by modules and then overridden by template files in the theme.

This works through the template filename. Template lookups in Iris are done using a system based on folder location and underscore divided sections. Here's how this works:

### Template naming

A theming function within the Iris system requests a template, passing through a list of parameters. For example, when requesting the template for an entity display (a page for example), these are:

* The entity type (page)
* The entity ID

A generic **page.html** template would match this lookup. If you wanted to use a different template for a specific page, you could simply add an underscore and the entity ID to this filename. So **page_5.html** for example.

Menus and other templates work in a similar way. **menu.html** is the general menu template **menu_menuname.html** is more specific and takes priority.

### Where Iris looks for templates.

The template system starts looking through the file system by looking at core and contributed Iris modules for a /templates folder. If a module has a templates folder it is checked for relevant templates. The later the module is loaded, the higher a priority it takes.

After checking modules, the system looks through the current theme in its home/themes/THEMENAME/templates folder.

Finally, the system checks the sites/SITENAME/templates folder. These files take the top priority.

So modules, themes and sites can easily override any other template files set in the system or fall back to defaults.

### Typical templates

The `html` template, or `html.html`, is used as the main wrapper template for the site. This template is a full HTML template that should include the opening `<html>` tag, the header and the `<body>` tag as well as any universally-used scripts or stylesheets in the page head. For many sites it is desirable that the same components are used everywhere, such as a menu or footer; this template can be used to display those also.

Each entity type has a template named after it; for example, the `page` entity type has a template called `page.html`. This will be used to render the entity's content and has the entity variables made available for it automatically.

Templates may be made more specific. If an underscore followed by the entity ID to an entity template's filename (resulting in something like `entity_4.html`), that template will only be used when that specific entity ID is loaded. `page_4.html` would only be used for the entity with ID `4`, as another example.

Custom templates can be named arbitrarily and embedded in other templates.

Other templates include pages for common HTTP status codes: `404.html`, `403.html`, `500.html`.

## Templating

### Template parsing

Templates are selected based on what page is being loaded - e.g. the `page` template is loaded when a page entity is requested.

Relevant variables relating to the current page are made available as Handlebars variables (see below for more information on Handlebars).

Templates are parsed for embeds - the triple-bracked directives mentioned earlier - the embeds converted into markup, and the new markup parsed for embeds, recursively. So embeds can contain embeds!

**Note:** it is possible to make a template embed itself, or to create two templates that embed each other. This will cause an infinite loop, and cause loading the page to hang. This won't normally happen but being aware of this issue may help you to debug it.

Some types of embed will make additional Handlebars variables available.

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

### Entity fetch embeds

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

These are also made available to scripts on the client side - see the section below about *Using results of entity fetch embeds on the client side*.

### Handlebars

Iris uses a combination of Handlebars (http://handlebarsjs.com/) templating in addition to its own embed language. Handlebars has its own extensive documentation which you would be advised to refer to.

### Seeing available Handlebars variables

An easy way of seeing which Handlebars variables are available for you to use the following Handlebars snippet:

```
{{#each this}}
{{@key}}
{{/each}}

```

### The "{{current}}" variable

When viewing an entity page directly through its path, a Handlebars variable of _current_ will be made available. The fields visible on this will depend on the field view permissions of the current user viewing the page.

### Using other templating languages

You can slot in any other templating language after these such as client side AngularJS or React templates as long as they don't clash with the delimeters of the handebars or Iris templates. You will have to use something other than curly or square brackets. Most templating languages allow you to pick custom delimeters to avoid clashes.

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

## Working with Iris content from the client side

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



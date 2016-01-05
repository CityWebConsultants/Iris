# Setup & Installation

This guide is intended to assist with installing Iris and introduce you to creating, configuring and using sites. At the end, you'll have a functioning site hosted with Iris.

## System requirements

Iris runs on Node.js so you'll need the latest version of that installed (5.0 at the time of writing). It will also need a connection to a MongoDB database. Iris was created and tested on Windows, Linux and OSX systems so hopefully it will work on your setup. Put in an issue in the issue queue if it doesn't and we'll try to help.

The standard distribution of Iris should be 100 MB or less in size.

## First steps

Once Iris is downloaded, run `npm install` in the root directory to install all dependencies. When adding modules that include their own dependencies or when updating Iris, you should run this process again.

## Directory structure

In the root directory you should find the core package.json file, a readme and an iris.js launch file. Once everything is installed you should have the following three directories.

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

#### Themes and Modules

These folders are where you should install contributed modules and themes (or place your own that you have developed). See the Extending Iris guide for more information.

#### Site folders

Iris is set up to allow you to run multiple instances of the server from the same codebase. These instances are called sites, and consist of their own configuration and files.

The `sites` folder inside `home` contains your site configurations.

Inside you'll find the following:

* __configurations__ - importable and exportable JSON configuration files for entity types, blocks, views and more are stored here.
* __files__ - Files uploaded into your site by its users are put here.
* __logs__ - This is where logs such as error or debug logs are stored. These can be viewed in the administrative interface. Feel free to back them up to another location or delete them when needed.
* __static__ - As with a themes or module's static folder, all files here are visible via a URL: `yoursiteurl/static/`
* __templates__ - This is where template overrides go. See template naming in the themes section of the Extending Iris guide to see how this works.
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

## Setting up a site

Make a new site by copying the default site (`sites/default`) to a new folder in the sites directory with a name of your choice. This directory name is important as it is the name of the site that you will use to launch it as an instance of Iris.

You should now have a folder in the sites directory. In this example, we'll say that the site is `sites/mysite`.

Inside the site folder, open `settings.json` and configure the database connection details.

Iris should now be ready to launch.

## Launching Iris

To start Iris, use the command `node iris.js site=<sitename>` in the Iris root directory.

You should see a list of enabled modules, followed by `Server started.` to indicate that everything started properly.

Your site should now be accessible on the port you specified in `settings.json`.

The server can be shut down at any time - just use Ctrl+C in the console.

The launch script will automatically restart the site in the event of an unhandled exception. If the site fails to restart successfully after a crash, it will shut down. Tools like `forever` and `pm2` may be useful for administrating your sites, or running in `tmux` or `screen` sessions.

If you have multiple sites you want to run simultaneously, simply launch another instance of `iris.js` for each extra site. No further commands should be necessary.

## Creating a first user

When you first access the site, you will be asked to set up your root admin account. This is your first user account which will be set up as an admin with the ability to do anything, so make sure you set a strong password. Don't forget these credentials, or you will be locked out of your site.

Once you have created this first user, you can access the site's Admin system at `yoursiteurl/admin`.

## Creating a front page
A newly set-up site won't have any content to display on its front page (the site URL root). By default, a 404 is actually returned but with some help text on how to create a front page.

To create a front page, go to the Admin area at `/admin`. Log in with your root user credentials.

Select *Entities* from the administration menu at the top of the page.

Under the tools for the *page* entity, select *Create new*.

Fill out a title and some body text for the front page, and set the path to `/`. Save the entity.

Your site is now set up.

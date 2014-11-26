Chat Application Core
=====================

API endpoints
-------------

_Note: POST requests are expected with encoding x-www-form-urlencoded for easy processing of text._

### /auth
Handles authorisation requests.

**POST parameters:**

* userid (string)   
The user ID as provided by a site making use of this server. For example, a user ID from Drupal sent from a Drupal chat integration module.
* key  
The site authorisation API key.

**Returns:**

* authorisation token for user

### /message

#### /add

Currently takes a single "content" parameter and responds with "message received"

### /group
Handles group creation and manipulation.

#### _/group/add_
Takes a group name and initial list of members; creates a server-side group entry.

**POST parameters:**

* name (string)  
The desired name of the group being created
* members (JSON stringified array)  
The desired set of members to be added to the group
#### _/group/edit_
Takes a group ID and any group object values and updates the server-side group entry (e.g. to change the title or add a user)

### /post
Handles posting of messges to a specified group.

### /fetch
Handles requests for message history and group information.

####_/fetch/group_
Returns group information. Takes an optional parameter `userid` which will return the groups that a specific userid belongs to.

####_/fetch/message_
Returns message(s) matching query.

Data structures
---------------
Group and message relations are stored using a semi-relational reference structure.

### Group
A group is essentially a named collection of users. All chats take place in a context of a group; a direct chat between two users takes place in a group which contains only those two users as members.

General group structure: `{ 'gid': 'group ID', 'members': {}, 'name': 'group name'}`

**Example group:**
```
{ '_id': '_ZS3sd234h',
  'members': {
    {'userid': '1', 'joined': 1416316036},
    {'userid': '2', 'joined': 1416316516},
    {'userid': '3', 'joined': 1416314536},
  }
  'name': 'An Example Group',
}
```

The generation of IDs is the responsibility of the database handler module.

### Message
Each message consists of an essential core set of values - author, group reference and timestamp (TODO: decide on whether to use the MongoDB ID for timestamping) followed by a content array that is filled depending on which modules are in use.

Messsage structure: `{ 'author': 'author ID', 'group': 'group ID', 'time': 'timestamp', 'content': {} }`

**Example message:**
```
{ '_id': '_aEfb2c23e3243d',
  'author': '1',
  'group': '_ZS3sd234h',
  'content': {},
}
```
Note that this message contains no content; it is nothing but a base object ready to have data such as a text message or file transfer request added to it by the relevant module. A text message might have content resembling `content: {text: "Example message body"}` or `{file-remote: "http://localhost/file.ext"}`.

The generation of IDs is the responsibility of the database handler module.

Files
-----
###server.js
Server implementation; runs an HTTP server instance to process REST API requests and web socket connections.

###client.js
Initial client implementation. This will test all the specified functionality by making API requests.

###hook.js
Event-based hook system module.

###config.js
The core system configuration file. Includes base settings and an enabled modules object.

**System Settings:**   

* port   
  Port number to run the server on

**Module Settings:**

* `name` (object)   
  Machine name of module to enable. This will be looked for in the filesystem under the chat_modules/ directory.

* `options` (object)   
Object of options that will be parsed by the module itself to determine its behaviour.

**Example modules table:**   
```
modules_enabled: [
    {
        name: 'auth',
        options: {
            token_length: 16
        }
    }
]
```

Module System
-------------
Modules are .js files stored in the chat_modules/ directory. Modules are loaded by looking for module entries 
in the config.js file (see config.js section above). A module is a single object returned by setting 
`module.exports` containing functions and options.

**Options**   
The `options` property of the module object is automatically populated from the config.js file during the
bootstrap process. One can set defaults as an `options` object within the module should the person configuring
the module not set any values.

**Init Function**   
A function contained within the `init` property of the module object will be run upon the module being loaded.

Standard Hooks
--------------
### hook_post
All POST requests sent to the server will generate a `hook_post` event. For example, sending a request to the URL /example would
trigger the event `hook_post_example` and pass an object containing the request URL (`url`) and the parsed POST object (`post`).

### hook_get
All GET requests sent to the server will generate a `hook_get` event in the same manner as `hook_post`. The parsed query string is
passed as the data object property `get`.

_Note: The database handler(s) will implement these `db` hooks._

### hook_db_insert
Call this hook and pass an object like the following: `{dbcollection: string, dbobject: {}}`.

### hook_db_find
Call this hook and pass an object like the following: `{dbcollection: string, dbquery: {}, findOne: bool}`.

### hook_db_update
Call this hook and pass an object like the following: `{dbcollection: string, dbquery: {}, dbupdate: {}, dbupsert: bool, dbmulti: bool}`.

_Note: The authentication handler(s) will implement these `auth` hooks._

### hook_auth_check
Call this hook and pass an object of the format `{userid: int, token: string}`. Callback object contains the property `authenticated`
which will be `true` or `false`.

Hook System
-----------
### Responding to Hooks
In order to respond to a hook, a module needs to provide an object named after the hook containing a rank specifying its place 
in the order of hook processing (i.e. whether it should run before or after another module) and an event function.

See this example.

```
hook_name: {
    rank: 2,
    event:
        function (data) {
            var url = data.value;
            var post = data.val2;
            
            process.emit('next', data);
        }
}
```

The `process.emit('next', data);` statement indicates that this module has completed its processing and is ready to pass the event
on to the next handler in the queue.

### Firing Hook Events
To fire a hook event, use the `process.hook` function, specifying a hook name and passing a data object:

```
process.hook('hook_name', data)
```

### Hooks with Callbacks
See this example of making a hook call and then using data it returns in a callback:

```
// Call db find hook.
process.hook('hook_db_find', {dbcollection: 'groups', dbquery: {}, callback: function (gotData) {
    // do things with gotData
    
    process.emit('next', data);
    }
});
```


Core Modules
------------
### mongodb

MongoDB database driver wrapper. Responds to the `hook_db` set of hooks to store and manipulate data in the database.

### auth

Handles user authorisation. Presents a REST API endpoint for assigning a randomly generated authorisation token to
a provided user ID.

### group_manager

Presents a basic REST API for group management.

### sockets

Presents an event system for socket.io connections.

### socket_message
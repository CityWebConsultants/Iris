Chat Application Core
=====================

API endpoints
-------------

_Note: POST requests are expected with encoding x-www-form-urlencoded for easy processing of text._

**User authentication:**

* userid (string)
The user ID of the sender.
* token (string)
The corresponding authorisation token.

These parameters need to be sent whenever an endpoint requires user authentication/authorisation.

### /auth
Handles authentication requests from the user management application/host CMS.

**POST parameters:**

* userid (string)
The user ID as provided by a site making use of this server. For example, a user ID from Drupal sent from a Drupal chat integration module.
* secretkey
The site authorisation API key.

**Returns:**

* authorisation token for user

### /message

#### /message/add [requires authentication]

Post a message to a group.

**POST parameters:**

* groupid (string)
The target group ID
* content (string)
The message contents
* messagetype (string)
The messagetype, e.g. `text`

**Returns:**

* newly created message ID

#### /message/hub [requires secret key]

Post a message to a group directly from the CMS.

**POST parameters**

* groupid
* content
* secretkey

### /group
Handles group creation and manipulation.

#### /group/add [requires authentication]
Takes a group name and initial list of members; creates a server-side group entry.

**POST parameters:**

* name (string)
The desired name of the group being created
* members (string) (may be appended more than once)
The desired set of members, as userids, to be added to the group
* is121 (optional; only value is 'true')
Whether this group is a one-to-one conversation.

**Returns:**

* Newly created group ID

#### /group/update/addmember  [requires authentication]
Adds a user to an existing group.

**POST parameters:**

* groupid (string)
The unique group ID of the referenced group
* userid (int)
The desired user to be added to the group

#### /group/update/removemember  [requires authentication]
Removes a member from an existing group.

**POST parameters:**

* groupid (string)
The unique group ID of the referenced group
* userid (int)
The desired user to be removed from the group

#### /group/update/name  [requires authentication]
Changes the name of an existing group.

**POST parameters:**

* groupid (string)
The unique group ID of the referenced group
* name (string)
The desired ne name of the group

### /fetch
Handles requests for message history and group information.

#### /fetch/groups  [requires authentication]
Returns group information. Takes a parameter `userid` which will return the groups that a specific userid belongs to.

See also /debug/groups for which the `userid` parameter is optional and when it is missing all groups in the system will be returned.

#### /fetch/group/users [requires authentication]
Returns the set of users that are contained in a provided group.

#### /fetch/message [requires authentication]
Returns message(s) matching query.

#### /fetch/messagetypes
Returns all valid messagetypes.

Socket Events
-------------
### message
This is pushed to a client whenever a new message is posted in one of their groups. Contains a message object.

Example: `{groupid: '5492b9311a4ecc3202c1a1cc', 'userid': 1, content: {'text': 'hello'}}`

### notification_message
This is pushed to a client whenever the state of a stored message or group changes, e.g. when a message is updated or removed or when a group is renamed or
created involving that user.

Example: `{action: 'name', groupid: '5492b9311a4ecc3202c1a1cc', time: 1418908303209}`

### online_users
This is pushed to all clients whenever the list of online users changes. Data is as follows: `{users: ['1', '2', '3']}` - in other words, an array of user IDs
under key `users`.

Data structures
---------------
Group and message relations are stored using a semi-relational reference structure.

### Group
A group is essentially a named collection of users. All chats take place in a context of a group; a direct chat between two users takes place in a group which contains only those two users as members.

General group structure: `{ 'gid': 'group ID', 'members': {}, 'name': 'group name', 'is121': true/false}`

**Example group:**
```
{ '_id': '_ZS3sd234h',
  'members': {
    {'userid': '1', 'joined': 1416316036},
    {'userid': '2', 'joined': 1416316516},
    {'userid': '3', 'joined': 1416314536},
  }
  'name': 'An Example Group',
  'is121': false
}
```

The generation of IDs is the responsibility of the database handler module.

The `is121` flag, if set to true, defines the group as a one-to-one chat. Such a chat can only contain two users and cannot be duplicated.

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

####System Settings:

* `port` (int)
  Port number to run the server on
* `secretkey` (string)
  Global super secret key. Used for authenticating the user authentication system. _Really secret._
* `messagetypes_enabled` (array)
  Enabled message types.

####Module Settings:

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

#### Options
The `options` property of the module object is automatically populated from the config.js file during the
bootstrap process. One can set defaults as an `options` object within the module should the person configuring
the module not set any values.

#### Dependencies
The proposed `dependencies` property would be an array of modules that this is dependent on.

####Init Function
A function contained within the `init` property of the module object will be run upon the module being loaded.

Global Functions
----------------

#### getPermissionsLevel _(user, groupid, authenticate?, callback)_
Returns Permissions Level for the user. Runs auth checks/secretkey checks based on the contents of the _user_ parameter as an object, e.g.

`user = {userid: 1, token: '2af3b3f}`

Group ID is optional and enables returning '2' if the user is a member of that group. This is a groupid reference and a query for that group will run.

#### checkGroupPermissions _(group, action, level, callback)_
Returns `true` or `false` depending on whether the user has the permissions to perform a given action on a group.

Group must be an object, but if it contains only an `_id` key the rest of the group object will be queried for.

Standard Hooks
--------------
### API endpoints

#### hook_post
All POST requests sent to the server will generate a `hook_post` event. For example, sending a request to the URL /example would
trigger the event `hook_post_example` and pass an object containing the request URL (`url`) and the parsed POST object (`post`).

#### hook_get
All GET requests sent to the server will generate a `hook_get` event in the same manner as `hook_post`. The parsed query string is
passed as the data object property `get`.

### Database or storage handling

#### hook_db_insert
Call this hook and pass an object like the following: `{dbcollection: string, dbobject: {}}`.

#### hook_db_find
Call this hook and pass an object like the following: `{dbcollection: string, dbquery: {}, findOne: bool}`.

#### hook_db_update
Call this hook and pass an object like the following: `{dbcollection: string, dbquery: {}, dbupdate: {}, dbupsert: bool, dbmulti: bool}`.

#### hook_db_remove
Call this hook and pass an object like the following: `{dbcollection: string, dbquery: {}}`.

### User management and authentication

#### hook_auth_check
Call this hook and pass an object of the format `{userid: int, token: string}`. Returns a boolean.

### Message preprocessing

#### hook_message_preprocess
Implementing this hook results in the relevant function being called with the entire message as `data.content` whenever a message is about to be stored in the database and then sent to clients. Making changes to the message will thus result in those changes being carried forwards into the DB and to the client.

#### hook_message_postprocess
Implementing this hook results in the relevant function being called with the message `content` object as `data.object` each time a message
is sent to a client. Therefore making changes to the message will affect how it is seen by clients but not how it is stored in the database.

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
To fire a hook event, use the `hook` function, specifying a hook name and passing a data object:

```
hook('hook_name', data)
```

### Hooks with Callbacks
See this example of making a hook call and then using data it returns in a callback:

```
// Call db find hook.
hook('hook_db_find', {dbcollection: 'groups', dbquery: {}}, function (gotData) {
    // do things with gotData

    process.emit('next', data);
    }
});
```
Sockets.js
----------
Presents these functions:

### process.addSocketListener

Add listener for a specific socket event.

### process.groupBroadcast

Send socket messages to every client in a given group.

### process.socketio

All socket.io stuff.

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

Handles sending and receiving of messages through web sockets.

### message_add

Presents a hook and API endpoints for saving and sending messages.

### message_edit

Presents hooks and API endpoints for editing and removing messages.

### message_fetch

Presents hooks and API endpoints for getting messages.

### message_types

Presents an API endpoint for showing the list of available message types.

### socket_notifications

Sends messages to clients that are within a group when messages are deleted or edited within that group, so that a
client application may instantly update or remove those messages.


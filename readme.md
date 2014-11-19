Chat Application Core
=====================

API endpoints
-------------

### /auth
Handles authorisation requests.

**POST parameters:**

* uid (string)   
The user ID as provided by a site making use of this server. For example, a user ID from Drupal sent from a Drupal chat integration module.
* key  
The site authorisation API key.

**Returns:**

* authorisation token for user

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
Returns group information.
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
{ 'gid': '_ZS3sd234h',
  'members': {
    {'uid': '_5aErt33eB', 'joined': 1416316036},
    {'uid': '_3334dfEEd', 'joined': 1416316516},
    {'uid': '_EnDEKX34d', 'joined': 1416314536},
  }
  'name': 'An Example Group',
}
```
### Message
Each message consists of an essential core set of values - author, group reference and timestamp (TODO: decide on whether to use the MongoDB ID for timestamping) followed by a content array that is filled depending on which modules are in use.

Messsage structure: `{ 'author': 'author ID', 'group': 'group ID', 'time': 'timestamp', 'content': {} }`

**Example message:**
```
{ 'author': '_5aErt33eB',
  'group': '_ZS3sd234h',
  'timestamp': 1416316536,
  'content': {},
}
```
Note that this message contains no content; it is nothing but a base object ready to have data such as a text message or file transfer request added to it by the relevant module. A text message might have content resembling `content: {text: "Example message body"}`.

Files
-----

###server.js

###client.js
Initial client implementation. This will test all the specified functionality by making API requests.

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

**API endpoints**   
To present an API endpoint, a module must implement a `rest` or equivalent method which will automatically be
called by the base system and passed the relevant values.

**Options**   
The `options` property of the module object is automatically populated from the config.js file during the
bootstrap process. One can set defaults as an `options` object within the module should the person configuring
the module not set any values.

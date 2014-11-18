Chat Application Core
=====================

API endpoints
-------------

### /auth
Handles authorisation requests.

Returns an authorisation token for a user.

**POST parameters:**

* uid (string)   
The user ID as provided by a site making use of this server. For example, a user ID from Drupal sent from a Drupal chat integration module.
* key  
The site authorisation API key.

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
    {uid: '_5aErt33eB', joined: 1416316036},
    {uid: '_3334dfEEd', joined: 1416316516},
    {uid: '_EnDEKX34d', joined: 1416314536},
  }
  'name': 'An Example Group',
}
```
### Message
Each message consists of an essential core set of values - author, group reference and timestamp (@todo: decide on whether to use the MongoDB ID for timestamping) followed by a content array that is filled depending on which modules are in use.

Messsage structure: `{ 'author': 'author ID', 'group': 'group ID', 'time': 'timestamp', 'content': [] }`

**Example message:**
```
{ 'author': '_5aErt33eB',
  'group': '_ZS3sd234h',
  'timestamp': 1416316536,
  'content': [],
}
```
Note that this message contains no content; it is nothing but a base object ready to have data such as a text message or file transfer request added to it by the relevant module. A text message might have content resembling `content: {text: "Example message body"}`.

Files
-----

###server.js

###client.js
Initial client implementation. This will test all the specified functionality by making API requests.

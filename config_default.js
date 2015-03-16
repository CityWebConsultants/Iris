/*  Configuration file for the chat application
 *
 *  Global values:
 *  - port:             port number to run the web server on                integer
 *  - secret_key:       secret API key to access authentication             string
 *  - modules_enabled:  array of enabled module objects                     array
 *      - name, options{}                                                   string, object
 */

module.exports = {
    port: 3000,
    peerport: 3001,
    secret_key: 'letmein',
    messagetypes_enabled: ['text', 'code', 'hub_message'],
    admins: [1],
    systemuser: 1,
    modules_enabled: [
        {
            name: 'debug'
        },
        {
            name: 'auth',
            options: {
                token_length: 16,
                allowdebug: true
            }
        },
        {
            name: 'mongodb',
            options: {
                server: 'localhost',
                port: 27017,
                database_name: 'chat-app',
                prefix: ''
            }
        },
        {
            name: 'sockets'
        },
        {
            name: 'group_manager',
            options: {
                allowdebug: true
            }
        },
        {
            name: 'message_add'
        },
        {
            name: 'highlight'
        },
        {
            name: 'message_types'
        },
        {
            name: 'message_fetch'
        },
        {
            name: 'message_edit'
        },
        {
            name: 'socket_notifications'
        },
        {
            name: 'activity',
            options: {
                awayCleanupTime: 30000
            }
        },
        {
            name: 'socket_groups'
        },
        {
            name: 'logout'
        },
        {
            name: 'peerauth'
        },
        {
            name: 'mediacall'
        },
        {
            name: 'user_sync'
        },
        {
            name: 'group_sync'
        }
    ]
};

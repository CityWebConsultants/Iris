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
    secret_key: 'letmein',
    messagetypes_enabled: ['text', 'code'],
    modules_enabled: [
        {
            name: 'auth',
            options: {
                token_length: 16
            }
        },
        {
            name: 'mongodb',
            options: {
                connection_url: 'mongodb://localhost:27017/',
                database_name: 'chat-app',
                prefix: ''
            }
        },
        {
            name: 'sockets'
        },
        {
            name: 'socket_message'
        },
        {
            name: 'group_manager'
        },
        {
            name: 'message_add'
        },
        {
            name: 'highlight'
        },
        {
            name: 'message_types'
        }
    ]
};

module.exports = {
    port: 3000,
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
        }
    ]
};

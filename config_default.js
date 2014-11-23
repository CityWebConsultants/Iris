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
                prefix: '',
            }
        },
        {
            name: 'group_add',
            options: {}
        },
    ]
};

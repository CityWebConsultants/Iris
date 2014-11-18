module.exports = {
    port: 3000,
    modules_enabled: [
        {
            name: 'auth_test',
            options: {
                token_length: 16
            }
        }
    ]
};

module.exports = {
    port: 3000,
    modules_enabled: [
        {
            name: 'auth',
            options: {
                token_length: 16
            }
        }
    ]
};

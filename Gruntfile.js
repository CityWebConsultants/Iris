module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        jshint: {
            options: {
                jshintrc: true,
                // Squash warning on dot-notation.
                "-W069": true,
            },
            // Include core and exclude libraries and dependencies.
            all: ['*.js', 'modules/core/**/*.js', 'modules/extra/**/*.js', '!modules/core/**/deps/*', '!*min.js']
        }
    });

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.registerTask('default', ['jshint']);

};

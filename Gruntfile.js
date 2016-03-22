module.exports = function (grunt) {
    'use strict';

    grunt.initConfig({
        jasmine_node: {
            api_entity_actions: {
                options: {
                    coverage: {},
                    forceExit: false,
                    match: '.',
                    matchAll: false,
                    specFolders: ['iris_core/test'],
                    extensions: 'js',
                    specNameMatcher: 'spec',
                    captureExceptions: true,
                    junitreport: {
                        report: true,
                        savePath: './build/reports/jasmine/',
                        useDotNotation: true,
                        consolidate: true
                    }
                },
                src: ['**/*.js']
            }
        },
        jshint: {
            options: {
                jshintrc: true,
                // Squash warning on dot-notation.
                '-W069': true
            },
            // Include core and exclude libraries and dependencies.
            all: ['iris_core/*.js', 'iris_core/modules/core/*/*.js', 'iris_core/modules/extra/*/*.js', '!iris_core/modules/core/**/deps/*', '!*min.js']
        }
    });

    grunt.loadNpmTasks('grunt-jasmine-node-coverage');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.registerTask('default', ['jasmine_node','jshint']);

};

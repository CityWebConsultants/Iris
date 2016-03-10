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
        }
    });

    grunt.loadNpmTasks('grunt-jasmine-node-coverage');

    grunt.registerTask('default', 'jasmine_node');
};

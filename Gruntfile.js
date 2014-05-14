/*global module:false*/
module.exports = function(grunt) {

    var assetsBanner = '/*! <%= pkg.name %> - v<%= pkg.version %> <%= grunt.template.today("dd-mm-yyyy HH:mm:ss") %> */\n';

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        compass: {
            page: {
                options: {
                    basePath: 'UI',
                    config: 'UI/config.rb',
                    // relativeassets: true
                }
            }
        },

        watch: {
            css_app: {
                files: ['UI/sass/*.scss'],
                tasks: ['compass']
            },
            livereload: {
                // Here we watch the files the sass task will compile to
                // These files are sent to the live reload server after sass compiles to them
                options: { livereload: true },
                files: ['UI/css/*'],
            },
        },

        jshint: {
            options: {
                jshintrc: '.jshintrc'
            },
            app: ['UI/js/**/*.js', '*.json', 'Gruntfile.js']
        },

        uglify: {
            options: {
                banner: assetsBanner
            },
            prod: {
                expand: true,
                cwd: 'js',
                src: '*.js',
                dest: 'js/'
            },
        },

        cssmin: {
            options: {
                banner: assetsBanner,
                keepSpecialComments: 0
            },
            prod: {
                expand: true,
                cwd: 'css/',
                src: '*.css',
                dest: 'css/'
            }
        },

        groundskeeper: {
            options: {
                replace: '"cl"'
            },
            prod: {
                expand: true,
                cwd: 'js',
                src: '*.js',
                dest: 'js'
            }
        },

        h5bp_cachebuster: {
            options: {
                algorithm: 'crc32'
            },
            prod: {
                expand: true,
                cwd: 'css/',
                src: '**/*.css',
                dest: 'css/'
            }
        },

        clean : {
            assets : {
                src : [ 'js/*.js', 'css/*.css'],
            },
        }
    });

    // These plugins provide necessary tasks.
    grunt.loadNpmTasks('grunt-contrib-compass');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-h5bp-cachebuster');
    grunt.loadNpmTasks('grunt-groundskeeper');

    // Default task.
    grunt.registerTask('default', []);
    grunt.registerTask('hint', ['jshint']);
    grunt.registerTask('dump:prod', ['dump:dev', 'cssmin', 'h5bp_cachebuster', 'uglify', 'groundskeeper']);
    grunt.registerTask('dump', ['dump:prod']);
    grunt.registerTask('clear', ['clean']);
};

// sudo gem install em-websocket

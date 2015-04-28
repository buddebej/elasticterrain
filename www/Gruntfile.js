module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            app: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['data/**', 'ressources/font-awesome/**', 'ressources/images/**', 'index.html'],
                    dest: 'dist/'
                }]
            },
            ol: {
                files: [{
                    expand: true,
                    flatten: true,
                    src: '../ol3/build/ol.js',
                    dest: 'dist/'
                }]
            }
        },
        concat: {
            dist: {
                src: ['src/js/*.js'],
                dest: 'dist/temp.js'
            },
            lib: {
                src: ['src/ressources/js/*.js', 'dist/ol.js', 'dist/temp_min.js'],
                dest: 'dist/app.min.js'
            },
            css: {
                src: ['src/ressources/css/*.css'],
                dest: 'dist/ressources/css/app.css'
            }
        },
        removeLoggingCalls: {
            // the files inside which you want to remove the console statements 
            files: ['dist/temp.js'],
            options: {
                // an array of method names to remove 
                methods: ['log', 'info', 'assert'],

                // replacement strategy 
                strategy: function(consoleStatement) {
                    // comments console calls statements 
                    // return '/* ' + consoleStatement + '*/';
                    return ''; // to remove  
                }
            }
        },
        uglify: {
            options: {
                banner: '/*! <%= pkg.name %> <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            build: {
                src: 'dist/temp.js',
                dest: 'dist/temp_min.js'
            }
        },
        clean: {
            all: ['dist/*'],
            js: ["dist/*.js", "!dist/*.min.js"]
        },
        processhtml: {
            js: {
                files: {
                    'dist/index.html': ['dist/index.html']
                }
            },
        },
    });


    // Load the plugin that provides the 'uglify' task.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-processhtml');
    grunt.loadNpmTasks('grunt-remove-logging-calls');


    grunt.log.write('Building...').ok();

    grunt.registerTask('default', ['clean:all', 'copy:app', 'copy:ol', 'concat', 'removeLoggingCalls', 'uglify', 'concat:lib', 'copy', 'processhtml', 'clean:js']);

};

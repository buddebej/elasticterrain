module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            app: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['data/**', 'resources/font-awesome/**', 'resources/images/**', 'resources/css/images/**', 'index.html'],
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
                src: ['src/resources/js/*.js', 'dist/ol.js', 'dist/temp_min.js'],
                dest: 'dist/app.min.js'
            },
            css: {
                src: ['src/resources/css/*.css'],
                dest: 'dist/resources/css/app.css'
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
        replace: {
            dist: {
                src: ['dist/temp.js'],
                overwrite: true, // overwrite matched source files
                replacements: [{
                    from: "url: 'http://eu.elasticterrain.xyz/data/tiles/{z}/{x}/{y}.png",
                    to: "url: 'data/tiles/{z}/{x}/{y}.png"
                }]
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
    grunt.loadNpmTasks('grunt-text-replace');


    grunt.log.write('Building...').ok();

    grunt.registerTask('default', ['clean:all', 'copy:app', 'copy:ol', 'concat', 'replace', 'removeLoggingCalls', 'uglify', 'concat:lib', 'copy', 'processhtml', 'clean:js']);

};

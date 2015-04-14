module.exports = function(grunt) {

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        copy: {
            app: {
                files: [{
                    expand: true,
                    cwd: 'src/',
                    src: ['data/**', 'ressources/font-awesome/**', 'ressources/images/**'],
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
            options: {
                data: {
                    message: 'Hello world!'
                }
            },
            js: {
                files: {
                    'dist/index.html': ['src/index.html']
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

    grunt.log.write('Building...').ok();

    grunt.registerTask('default', ['clean:all', 'copy:app', 'copy:ol', 'concat', 'uglify', 'concat:lib', 'copy', 'processhtml', 'clean:js']);

};

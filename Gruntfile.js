module.exports = function(grunt){

  // load plugins
  [
    'grunt-cafe-mocha',
    'grunt-contrib-jshint',
    'grunt-contrib-less',
    'grunt-exec'
  ].forEach(function(task){
    grunt.loadNpmTasks(task);
  });

  // configure plugins
  grunt.initConfig({
    cafemocha: {
      all: {
        src: 'qa/tests-*.js',
//        src: 'qa/tests-stress.js',
        options: {
          ui: 'tdd'
        }
      }
    },
    exec: {
      linkchecker: {
        cmd: 'linkchecker http://localhost:3000'
      }
    },
    jshint: {
      app: [
        'meadowlark.js',
        'public/js/**/*.js',
        'lib/**/*.js',
      ],
      qa: [
        'Gruntfile.js',
        'public/qa/**/*.js',
        'qa/**/*.js'
      ]
    },
    less: {
      development: {
        options: {
          customFunctions: {
            static: function(lessObject, name) {
              return 'url("' +
                     require('./lib/static.js').map(name.value) +
                     '")';
            }
          }
        },
        files: {
          'public/css/main.css': 'less/main.less'
        }
      }
    }
  });

  // register tasks
//  grunt.registerTask('default', ['cafemocha','jshint','exec']);
//  grunt.registerTask('default', ['cafemocha']);
  grunt.registerTask('default', [
    'cafemocha',
    'exec',
    'jshint',
    'less'
  ]);
};

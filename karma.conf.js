// Karma configuration
// Generated on Thu Jan 28 2016 08:02:07 GMT-0700 (MST)

module.exports = function(config) {
  config.set({

    plugins: [
      'karma-coverage',
      'karma-mocha',
      'karma-chai',
      'karma-sinon',
      'karma-phantomjs-launcher'
    ],

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'sinon'],


    // list of files / patterns to load in the browser
    files: [
      'public/bower_components/jquery/jquery.min.js',
      'public/bower_components/underscore/underscore-min.js',
      'public/bower_components/angular/angular.js',
      'public/bower_components/angular-mocks/angular-mocks.js',
      'public/bower_components/angular-resource/angular-resource.min.js',
      'public/bower_components/angular-sanitize/angular-sanitize.min.js',
      'public/bower_components/angular-route/angular-route.min.js',
      'public/bower_components/leaflet/dist/leaflet-src.js',
      'public/bower_components/leaflet-draw/dist/leaflet.draw.js',
      'public/bower_components/leaflet.loading/src/Control.Loading.js',
      'public/bower_components/Leaflet.awesome-markers/dist/leaflet.awesome-markers.min.js',
      'public/bower_components/leaflet-groupedlayercontrol/dist/leaflet.groupedlayercontrol.min.js',
      'public/bower_components/angular-ui-select/dist/select.min.js',
      'public/bower_components/angular-ui-scrollpoint/dist/scrollpoint.js',
      'public/bower_components/moment/min/moment.min.js',
      'public/bower_components/mjolnic-bootstrap-colorpicker/dist/js/bootstrap-colorpicker.js',
      'public/vendor/angular-bootstrap/ui-bootstrap-tpls-0.13.0-SNAPSHOT.min.js',
      'public/bower_components/bootstrap/dist/js/bootstrap.js',
      'public/bower_components/turf/turf.js',
      'public/bower_components/proj4/dist/proj4.js',
      'public/app/app.js',
      'public/app/**/*.js',
      'public/test/**/*.js'
    ],


    // list of files to exclude
    exclude: [
      'public/app/bower_components/**/*'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'public/app/**/*.js': ['coverage']
    },


    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress', 'coverage'],

    coverageReporter: {
      // specify a common output directory
      dir: 'coverage/browser-coverage',
      includeAllSources: true,
      reporters: [
        // reporters not supporting the `file` property
        { type: 'html', subdir: 'html' }
      ]
    },


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });
};

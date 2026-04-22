// Karma configuration
module.exports = function(config) {
  config.set({
    // Base path for resolving patterns
    basePath: '',

    // Frameworks to use
    frameworks: ['jasmine'],

    // List of files to load in browser
    files: [
      // AngularJS
      'node_modules/angular/angular.js',
      'node_modules/angular-mocks/angular-mocks.js',
      
      // Compiled application files
      'dist/types.js',
      'dist/app.js',
      
      // Test files
      'test/**/*.spec.js'
    ],

    // List of files to exclude
    exclude: [],

    // Preprocess matching files before serving them
    preprocessors: {},

    // Test results reporter
    reporters: ['spec'],

    // Web server port
    port: 9876,

    // Enable/disable colors in output
    colors: true,

    // Level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,

    // Enable/disable watching file changes
    autoWatch: true,

    // Browsers to launch
    browsers: ['ChromeHeadless'],

    // Custom launcher for CI environments
    customLaunchers: {
      ChromeHeadlessCI: {
        base: 'ChromeHeadless',
        flags: ['--no-sandbox']
      }
    },

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level - how many browsers to run at once
    concurrency: Infinity,

    // Client configuration
    client: {
      jasmine: {
        random: false
      }
    }
  });
};

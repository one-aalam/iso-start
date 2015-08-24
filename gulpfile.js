var path = require('path'),
    fs   = require('fs'),
    webpack = require('webpack'),
    gulp  = require('gulp'),
    nodemon = require('nodemon'),
    DeepMerge = require('deep-merge');

var deepmerge = DeepMerge(function(target, source, key) {
  if(target instanceof Array) {
    return [].concat(target, source);
  }
  return source;
});

// generic

var defaultConfig = {
  module: {
    loaders: [
      {test: /\.js$/, exclude: /node_modules/, loaders: ['babel'] },
    ]
  }
};

if(process.env.NODE_ENV !== 'production') {
  defaultConfig.devtool = '#eval-source-map'; // more performant
  defaultConfig.debug = true;
}

function config(overrides) {
  return deepmerge(defaultConfig, overrides || {});
}

// Webpack don't plays well with binary dependencies. We need to use
// `external` to define modules it shouldn't touch
var nodeModules = {}; 

  fs.readdirSync('node_modules')
      .filter(function(file){
        return ['.bin'].indexOf(file) === -1;
      })
      .forEach(function(module){
        nodeModules[module] = 'commonjs ' + module;
      });


var frontendConfig = config({
  entry: './static/js/main.js',
  output: {
    path: path.join(__dirname, 'build'),
    filename: 'frontend.js'
  }
});

var backendConfig = config({
  entry: './src/main.js',
  target: 'node', // don't touch built-in modules
  plugins: [
  // Add sourcemap support for back-end
    new webpack.BannerPlugin('require("source-map-support").install();',
    { raw: true, entryOnly: false }),
  // Ignore CSS/Less for backend
    new webpack.IgnorePlugin(/\.(css|less)$/)
  ],
  output: {
        path: path.join(__dirname, 'build'),
        filename: 'backend.js'
  },
  externals: nodeModules,
  __dirname: true,
  __filename: true
});

function onBuild(done) {
  return function(err, stats) {
    if(err) {
      console.log('Error', err);
    }
    else {
      console.log(stats.toString());
    }

    if(done) {
      done();
    }
  }
}

    gulp.task('backend-build', function(done) {
      webpack(backendConfig).run(onBuild(done));
    });
    gulp.task('backend-watch', function() {
      webpack(backendConfig).watch(100, function(err, stats) {
        onBuild()(err, stats);
        nodemon.restart();
      });
    });

    gulp.task('frontend-build', function(done) {
      webpack(frontendConfig).run(onBuild(done));
    });
    gulp.task('frontend-watch', function() {
      webpack(frontendConfig).watch(100, onBuild());
    });

    gulp.task('build', ['frontend-build', 'backend-build']);
    gulp.task('watch', ['frontend-watch', 'backend-watch']);
    gulp.task('run', ['backend-watch', 'frontend-watch'], function() {
      nodemon({
        execMap: {
          js: 'node'
        },
        script: path.join(__dirname, 'build/backend'),
        ignore: ['*'],
        watch: ['foo/'],
        ext: 'noop'
      }).on('restart', function() {
        console.log('Restarted!');
      });
    });


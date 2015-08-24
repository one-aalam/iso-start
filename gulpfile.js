var path = require('path'),
    fs   = require('fs'),
    webpack = require('webpack'),
    gulp  = require('gulp'),
    nodemon = require('nodemon'),
    DeepMerge = require('deep-merge'),
    WebpackDevServer = require('webpack-dev-server');;

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
      {test: /\.js$/, exclude: /node_modules/, loaders: ['monkey-hot', 'babel'] },
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
  entry: [
   'webpack-dev-server/client?http://localhost:3000',
   'webpack/hot/only-dev-server',
   './static/js/main.js'
  ],
  output: {
    path: path.join(__dirname, 'build'),
    publicPath: 'http://localhost:3000/build',
    filename: 'frontend.js'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin({ quiet: true })
  ]
});

var backendConfig = config({
  entry: [
    'webpack/hot/signal.js',
    './src/main.js'
  ],
  target: 'node', // don't touch built-in modules
  recordsPath: path.join(__dirname, 'build/_records'),
  plugins: [
  // Add sourcemap support for back-end
    new webpack.BannerPlugin('require("source-map-support").install();',
    { raw: true, entryOnly: false }),
  // Ignore CSS/Less for backend
    new webpack.IgnorePlugin(/\.(css|less)$/),
    new webpack.HotModuleReplacementPlugin({ quiet: true })
  ],
  output: {
        path: path.join(__dirname, 'build'),
        filename: 'backend.js'
  },
  externals: nodeModules,
  node: {
    __dirname: true,
    __filename: true
  }
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
      var firedDone = false;
      webpack(backendConfig).watch(100, function(err, stats) {
        if(!firedDone) {
          firedDone = true;
          done();
        }
        nodemon.restart();
      });
    });

    gulp.task('frontend-build', function(done) {
      webpack(frontendConfig).run(onBuild(done));
    });
    gulp.task('frontend-watch', function() {
     // webpack(frontendConfig).watch(100, onBuild());
     new WebpackDevServer(webpack(frontendConfig), {
        publicPath: frontendConfig.output.publicPath,
        hot: true
      }).listen(3000, 'localhost', function (err, result) {
        if(err) {
          console.log(err);
        }
        else {
          console.log('webpack dev server listening at localhost:3000');
        }
      });
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


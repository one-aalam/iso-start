var path = require('path'),
    fs   = require('fs'),
    webpack = require('webpack');

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

    module.exports = {
      entry: './src/main.js',
      target: 'node', // don't touch built-in modules
      plugins: [
        // Add sourcemap support for back-end
        new webpack.BannerPlugin('require("source-map-support").install();',
          { raw: true, entryOnly: false }),
        // Ignore CSS/Less for backend
        new webpack.IgnorePlugin(/\.(css|less)$/)
      ],
      module: {
        loaders: [
          {test: /\.js$/, exclude: /node_modules/, loaders: ['babel'] },
        ]
      },
      output: {
        path: path.join(__dirname, 'build'),
        filename: 'backend.js'
      },
      externals: nodeModules,
      devtool: 'sourcemap'
    }
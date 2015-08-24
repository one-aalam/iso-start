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
      output: {
        path: path.join(__dirname, 'build'),
        filename: 'backend.js'
      },
      externals: nodeModules
    }
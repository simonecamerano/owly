const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const Dotenv = require('dotenv-webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageMinimizerPlugin = require('image-minimizer-webpack-plugin');

module.exports = {
  // Entry point: main JavaScript file
  entry: './src/assets/js/index.js',
  
  // Where to save the final bundle
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true, // Clean dist folder on each build
  },
  
  // Development mode (change to 'production' for production)
  mode: 'production',
  
  // Source maps for debugging
  devtool: 'inline-source-map',
  
  // Dev server configuration
  devServer: {
    static: './dist',
    port: 3000,
    open: true, // Automatically open browser
    hot: true,  // Hot Module Replacement
  },
  
  // Loaders to handle different file types
  module: {
    rules: [
      {
        // For CSS files
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },
      {
        // For images
        test: /\.(png|svg|jpg|jpeg|gif)$/i,
        type: 'asset/resource',
      },
      {
        // For fonts
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
      },
    ],
  },
  
  // Optimization
  optimization: {
    minimizer: [
      '...',
      new ImageMinimizerPlugin({
        minimizer: {
          implementation: ImageMinimizerPlugin.imageminMinify,
          options: {
            plugins: [
              ['imagemin-pngquant', { quality: [0.65, 0.80], speed: 4 }],
              ['imagemin-svgo', { plugins: [{ name: 'preset-default' }] }],
            ],
          },
        },
      }),
    ],
  },

  // Plugins
  plugins: [
    // Load environment variables from .env file
    new Dotenv(),
    // Automatically generate index.html with bundle included
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'Owly App',
    }),
    // Copy static assets to dist folder with image optimization
    new CopyWebpackPlugin({
      patterns: [
        {
          from: 'src/assets/img',
          to: 'img',
          noErrorOnMissing: true,
        },
        {
          from: 'src/favicon.svg',
          to: 'favicon.svg',
          noErrorOnMissing: true,
        },
      ],
    }),
  ],
};

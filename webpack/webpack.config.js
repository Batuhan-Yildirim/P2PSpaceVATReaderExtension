const path = require('path');

module.exports = {
  entry: './scripts/popup.js', // or your main JS file
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
  },
  mode: 'production'
};
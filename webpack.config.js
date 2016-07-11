module.exports = {
  entry: './example/index.js',
  output: {
    path: 'example',
    filename: 'bundle.js'
  },
  module: {
    loaders: [
      {test: /\.css$/, loader: 'style!css'},
      {test: /\.jsx?$/, exclude: /node_modules/, loader: 'babel-loader'},
      {test: /\.png$/, loader: 'url-loader?mimetype=image/png'},
      {test: /\.json$/, loader: 'json' },
      {test: /\.html$/, loader: 'html'}
    ]
  },
  plugins: []
}

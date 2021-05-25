const path = require('path')

module.exports = {
	entry: './src/init',
	output: {
    path: path.resolve(__dirname, 'static'),
		//path: __dirname + '/static',
		filename: '[name].js',
	},
	performance: {
		hints: false
	},
	module: {
		rules: [
			{
				test: /\.(js|jsx)$/,
				exclude: /node_modules/,
				use: {
					loader: 'babel-loader'
				}
			},
			{
				test: /\.css$/i,
				use: ['style-loader', 'css-loader'],
			},
			{
				test: /\.(woff(2)?|ttf|eot|svg)(\?v=\d+\.\d+\.\d+)?$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: '[name].[ext]',
							outputPath: './fonts'
						}
					}
				]
			}
		]
	}
}


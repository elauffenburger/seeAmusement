const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

let config = {
    entry: {
        songs: './src/songs/index.ts'
    },
    output: {
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            { test: /\.ts$/, loader: 'awesome-typescript-loader' },
            {
                test: /\.js$/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env']
                    }
                }
            }
        ]
    },
    devtool: 'inline-source-map',
    target: 'node',
    plugins: [
        new CopyPlugin([
            './template.yaml'
        ])
    ],
    resolve: {
        extensions: ['.json', '.ts'],
        alias: {
            'node-fetch': path.resolve(__dirname, './node_modules/node-fetch/lib/index.js'),
            'encoding-japanese': path.resolve(__dirname, './node_modules/encoding-japanese/encoding.js')
        }
    },
    optimization: {
        minimizer: [
            new UglifyJsPlugin({
                sourceMap: true,
                uglifyOptions: {
                    mangle: false
                }
            })
        ]
    }
}

exports.default = config;
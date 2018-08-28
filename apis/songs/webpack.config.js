const path = require('path');

const CopyPlugin = require('copy-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const slsw = require('serverless-webpack');

let config = {
    mode: 'development',
    entry: slsw.lib.entries,
    output: {
        libraryTarget: 'commonjs',
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js'
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
            './template.yaml',
            './serverless.yml'
            // Note to future Eric: the issue is that you're dropping .ts files in the dist
            // folder, which node obviously isn't going to recognize as modules.  You'll need to 
            // drop the transpiled source there and that should solve the sls MODULE_NOT_FOUND issue
        ])
    ],
    resolve: {
        extensions: ['.json', '.ts', '.js'],
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

module.exports = config;
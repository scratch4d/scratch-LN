const CopyWebpackPlugin = require('copy-webpack-plugin');
const defaultsDeep = require('lodash.defaultsdeep');
const path = require('path');
const webpack = require('webpack');

const base = {
    devServer: {
        contentBase: false,
        host: '0.0.0.0',
        port: process.env.PORT || 8008
    },
    devtool: 'cheap-module-source-map',
    module: {
        rules: [{
            test: /\.js$/,
            loader: 'babel-loader',
            include: path.resolve(__dirname, 'src'),
            query: {
                presets: ['es2015']
            }
        }]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({
            include: /\.min\.js$/,
            minimize: true
        })
    ]
};


module.exports = [
    defaultsDeep({}, base, {
        target: 'web',
        entry: {
            'test':'./testWebpage/test.js',
            'example':'./examples/example.js',
            'nice_live_view':'./live_view/live_view.js',
            'nice_live_view_blocks':'./live_view/live_view_blocks.js',
        },
        output: {
            filename: 'example/[name].js'
        },
        plugins: base.plugins.concat([
            /*new CopyWebpackPlugin([{
                from: './live_view/live_view.html',
                to: 'example/index.html'
            }]),*/
            new CopyWebpackPlugin([{
                from: './testWebpage/test.html',
                to: 'example/test.html'
            }]),new CopyWebpackPlugin([{
                from: './examples/nice_live_view.html',
                to: 'example/index.html'
            }]),new CopyWebpackPlugin([{
                from: './examples/nice_live_view_blocks.html',
                to: 'example/reverse.html'
            }]),
            new CopyWebpackPlugin([{
                from: 'examples/example.html',
                to: 'example/example.html'
            }]),
            new CopyWebpackPlugin([{
                from: 'examples/cdjlogo.jpeg',
                to: 'example/cdjlogo.jpeg'
            }]),
            new CopyWebpackPlugin([{
                from: 'examples/simple.html',
                to: 'example/simple.html'
            }]),
            new CopyWebpackPlugin([{
                from: 'examples/simple_en.html',
                to: 'example/simple_en.html'
            }]),
            new CopyWebpackPlugin([{
                from: 'examples/documentation.html',
                to: 'example/documentation.html'
            }]),
            new CopyWebpackPlugin([{
                from: 'node_modules/scratch-blocks/media',
                to: 'example/static/blocks-media'
            }]),
            new CopyWebpackPlugin([{
                from: 'dist/ScratchLN.js',
                to: 'example/ScratchLN.js'
            }]),
        ]),
    })
];

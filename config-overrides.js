/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

const {
    override,
    addWebpackModuleRule,
    disableEsLint,
    addBabelPlugin
} = require('customize-cra');
const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');

function addWebpackBundleAnalyzer(config, options = {}) {
    if (process.env.NODE_ENV === 'production'
        && process.argv.indexOf('--bundle-report') !== -1) {
        config.plugins = (config.plugins || []).concat([
            new BundleAnalyzerPlugin(options),
        ]);
    }

    return config;
}

// Function to handle Material-UI v5 setup
function addMuiV5Support(config) {
    return config;
}

module.exports = override(
    // Basic config modifications
    config => ({
        ...config,
        output: {
            ...config.output,
            globalObject: 'this',
            // publicPath: '/'
        },
    }),
    // Disable ESLint to avoid conflicts with newer dependencies
    disableEsLint(),
    // Add bundle analyzer
    config => addWebpackBundleAnalyzer(config, {
        openAnalyzer: true,
        generateStatsFile: true,
        statsFilename: 'bundle-stats.json'
    }),
    // Worker loader configuration
    addWebpackModuleRule({
        test: /\.worker\.js$/,
        use: { 
            loader: 'worker-loader',
            options: { 
                filename: '[name].[contenthash].worker.js',
                publicPath: '/telegram-react/'
            }
        },
    }),
    addWebpackModuleRule({
        test: /\.worker\.js$/,
        use: { loader: 'worker-loader' },
    }),
    // // TDLib worker configuration
    // config => {
    //     // Make sure tdlib worker doesn't get minified to avoid syntax errors
    //     if (config.optimization && config.optimization.minimizer) {
    //         config.optimization.minimizer.forEach(minimizer => {
    //             if (minimizer.constructor.name === 'TerserPlugin') {
    //                 minimizer.options.exclude = /\.worker\.js$/;
    //             }
    //         });
    //     }
    //     return config;
    // },
    // MUI v5 setup
    addMuiV5Support,
    // Add support for emotion (required by MUI v5)
    addBabelPlugin('@emotion/babel-plugin')
);
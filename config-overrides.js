const webpack = require('webpack');
const path = require('path');

module.exports = function override(config) {
    // Ensure resolve objects exist
    config.resolve = config.resolve || {};
    config.resolve.fallback = {
        ...(config.resolve.fallback || {}),
        // Use .js extension — required for strict ESM modules (Webpack 5)
        process: require.resolve('process/browser.js'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        util: require.resolve('util'),
    };

    // Provide process and Buffer globally so simple-peer and other Node libs work
    config.plugins = (config.plugins || []).concat(
        new webpack.ProvidePlugin({
            process: 'process/browser.js',
            Buffer: ['buffer', 'Buffer'],
        })
    );

    return config;
};

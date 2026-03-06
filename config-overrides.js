const webpack = require('webpack');

module.exports = function override(config, env) {
    // Add polyfills for core Node modules that simple-peer requires
    config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve('process/browser'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        util: require.resolve('util'),
    };

    config.plugins = (config.plugins || []).concat([
        new webpack.ProvidePlugin({
            process: 'process/browser',
            Buffer: ['buffer', 'Buffer'],
        }),
    ]);

    return config;
};

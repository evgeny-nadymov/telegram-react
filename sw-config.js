module.exports = {
    swFilePath: './build/service-worker.js',
    cacheId: 'sw-precache-webpack-plugin',
    dontCacheBustUrlsMatching: /\.\w{8}\./,
    navigateFallback: '/index.html',
    navigateFallbackWhitelist: [ /^(?!\/__).*/ ],
    staticFileGlobsIgnorePatterns: [ /\.map$/, /asset-manifest\.json$/ ],
    staticFileGlobs:
        [   './build/**/**.html',
            './build/static/js/*.js',
            './build/static/css/*.css',
            './build/static/media/**',
            './build/*.wasm',],
    stripPrefix: './build',
    replacePrefix: '/telegram-react',
    maximumFileSizeToCacheInBytes: 10485760
};
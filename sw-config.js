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
            './build/*.wasm',
            './build/*.mem',
            './build/*.worker.js',
            './build/tdweb.js'],
    stripPrefix: './build',
    replacePrefix: '/telegram-react',
    maximumFileSizeToCacheInBytes: 31457280,
    importScripts: ['./custom-service-worker.js'],
    ignoreUrlParametersMatching: [/./]
};
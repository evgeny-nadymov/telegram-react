/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
    swFilePath: './build/service-worker.js',
    cacheId: 'sw-precache-webpack-plugin',
    dontCacheBustUrlsMatching: /\.\w{8}\./,
    navigateFallback: '/index.html',
    navigateFallbackWhitelist: [ /^(?!\/__).*/ ],
    staticFileGlobsIgnorePatterns: [ /\.map$/, /asset-manifest\.json$/ ],
    staticFileGlobs:
        [   './build/rlottie/*.*',
            './build/libwebp/*.*',
            './build/**/**.html',
            './build/static/js/*.js',
            './build/static/css/*.css',
            './build/static/media/*.*',
            './build/*.wasm',
            './build/*.worker.js',
            './build/tdweb.js',
            './build/*.css',
            './build/*.mp3',
            './build/*.jpg',
            './build/*.png',
            './build/data/*.*'],
    stripPrefix: './build',
    replacePrefix: '/telegram-react',
    maximumFileSizeToCacheInBytes: 10485760,
    templateFilePath: './service-worker.tmpl',
    importScripts: ['./custom-service-worker.js'],
    ignoreUrlParametersMatching: [/./]
};
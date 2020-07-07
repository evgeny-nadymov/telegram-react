/**
 * Copyright 2016 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

// DO NOT EDIT THIS GENERATED OUTPUT DIRECTLY!
// This file should be overwritten as part of your build process.
// If you need to extend the behavior of the generated service worker, the best approach is to write
// additional code and include it using the importScripts option:
//   https://github.com/GoogleChrome/sw-precache#importscripts-arraystring
//
// Alternatively, it's possible to make changes to the underlying template file and then use that as the
// new base for generating output, via the templateFilePath option:
//   https://github.com/GoogleChrome/sw-precache#templatefilepath-string
//
// If you go that route, make sure that whenever you update your sw-precache dependency, you reconcile any
// changes made to this original template file with your modified copy.

// This generated service worker JavaScript will precache your site's resources.
// The code needs to be saved in a .js file at the top-level of your site, and registered
// from your pages in order to be used. See
// https://github.com/googlechrome/sw-precache/blob/master/demo/app/js/service-worker-registration.js
// for an example of how you can register this script and handle various service worker events.

/* eslint-env worker, serviceworker */
/* eslint-disable indent, no-unused-vars, no-multiple-empty-lines, max-nested-callbacks, space-before-function-paren, quotes, comma-spacing */
'use strict';

var precacheConfig = [["/telegram-react/1.130f0ecf36ff90c87239.worker.js","de0a578a81653f8b3a340f5e6c4fac3a"],["/telegram-react/130f0ecf36ff90c87239.worker.js","a58dc2ef7ff9ade7f4b7ff0a78b760f6"],["/telegram-react/Android_2x.jpg","eb8506aef9761972b129f60f9ac7fd70"],["/telegram-react/Manytabs_2x.png","7a71629a5e4f7482b6320b103f1d543c"],["/telegram-react/WP_2x.jpg","a1d37d509e6740f40c0a4729dff3100b"],["/telegram-react/a848b8b40a9281225b96b8d300a07767.wasm","a848b8b40a9281225b96b8d300a07767"],["/telegram-react/data/Folders_1.json","01b7f0acf52990784baca0a19b821be3"],["/telegram-react/data/Folders_2.json","3f6c9400e50344c82b15a7acf5087a33"],["/telegram-react/data/TwoFactorSetupMonkeyClose.json","c322e3eabf46340f12ec7f4784d4115a"],["/telegram-react/data/TwoFactorSetupMonkeyIdle.json","b2c77121d458e17d18e642c51cb9821c"],["/telegram-react/data/TwoFactorSetupMonkeyPeek.json","d914e5d5fdef6b5596bb409689c8332d"],["/telegram-react/data/TwoFactorSetupMonkeyTracking.json","addf1beac01749387f1aea96a9bfb682"],["/telegram-react/data/countries.txt","ca17aa9eaa6afb376d594a5775c37b25"],["/telegram-react/e33e8791554f674a437f.worker.js","94f81dc17aec09ba23cb94d03a78c12c"],["/telegram-react/emoji-mart.dark.css","4b678ea9ad902831df273a6ee9fab1df"],["/telegram-react/emoji-mart.light.css","2704a69424786b2c2b207a0e645ff9d8"],["/telegram-react/iOS_2x.jpg","1d95f349db03f730edb3bc35224a303e"],["/telegram-react/index.html","4da7e8effbb937ad1a2f95333716991b"],["/telegram-react/sound_a.mp3","eba09b6a457792c52fc610b5f9f974b3"],["/telegram-react/static/css/0.885200b4.chunk.css","42809019382110872755e27173ea77f5"],["/telegram-react/static/css/4.0ae52e87.chunk.css","76c55364cb9771356a32b8a92e20d518"],["/telegram-react/static/css/6.6ede3073.chunk.css","f5e06c5e3f5578b56300915125c7b7d9"],["/telegram-react/static/css/8.3015292a.chunk.css","d4301d1a0542c34b984a241c7a092148"],["/telegram-react/static/css/main.decd9524.chunk.css","ed623df525d6f7f562124bd637490f0b"],["/telegram-react/static/js/0.9471dfec.chunk.js","3371751cddfee53dd6a21b79cfccd03e"],["/telegram-react/static/js/1.aed744c6.chunk.js","b1539cc8134de2a21108348c7f1a75a6"],["/telegram-react/static/js/4.8f1bc539.chunk.js","abc076afcc499ad73a9929e7f7a00f31"],["/telegram-react/static/js/5.33c481dc.chunk.js","5f2c7e0e4099f078ead4f30a9801c276"],["/telegram-react/static/js/6.e8642ff6.chunk.js","709f59b38a9c63f3538b96aa467b8b5b"],["/telegram-react/static/js/7.ea707708.chunk.js","51d4fd9967d08921c86745b517873f28"],["/telegram-react/static/js/8.ecba072c.chunk.js","b5ecce063fc71a86d038bbb38b420b0b"],["/telegram-react/static/js/main.9e7a00e8.chunk.js","57080cdb4bc6a5e79f775ee9b2e92eee"],["/telegram-react/static/js/runtime~main.f955c99e.js","f5426216a53df1a043c78260020d756d"],["/telegram-react/static/media/bg.9b7ea631.jpg","9b7ea631ddb3103beee05cec006af20e"],["/telegram-react/static/media/bubble-tail-left.cbb4eead.svg","cbb4eead04871188de6ce488808e4237"],["/telegram-react/static/media/bubble-tail-right.b159f8b0.svg","b159f8b04a1646f68bfc0bfb7f347cac"],["/telegram-react/static/media/check.71da7469.svg","71da74694e314a0e3a855ded564a1eaf"],["/telegram-react/static/media/telegram-logo.ac1331a4.svg","ac1331a490a116a48daa6c9f41b6db80"],["/telegram-react/tdweb.js","0f99a6ddae0be3fb809d8445d49982a6"]];
var cacheName = 'sw-precache-v3-sw-precache-webpack-plugin-' + (self.registration ? self.registration.scope : '');


var ignoreUrlParametersMatching = [/./];



var addDirectoryIndex = function(originalUrl, index) {
    var url = new URL(originalUrl);
    if (url.pathname.slice(-1) === '/') {
      url.pathname += index;
    }
    return url.toString();
  };

var cleanResponse = function(originalResponse) {
    // If this is not a redirected response, then we don't have to do anything.
    if (!originalResponse.redirected) {
      return Promise.resolve(originalResponse);
    }

    // Firefox 50 and below doesn't support the Response.body stream, so we may
    // need to read the entire body to memory as a Blob.
    var bodyPromise = 'body' in originalResponse ?
      Promise.resolve(originalResponse.body) :
      originalResponse.blob();

    return bodyPromise.then(function(body) {
      // new Response() is happy when passed either a stream or a Blob.
      return new Response(body, {
        headers: originalResponse.headers,
        status: originalResponse.status,
        statusText: originalResponse.statusText
      });
    });
  };

var createCacheKey = function(originalUrl, paramName, paramValue,
                           dontCacheBustUrlsMatching) {
    // Create a new URL object to avoid modifying originalUrl.
    var url = new URL(originalUrl);

    // If dontCacheBustUrlsMatching is not set, or if we don't have a match,
    // then add in the extra cache-busting URL parameter.
    if (!dontCacheBustUrlsMatching ||
        !(url.pathname.match(dontCacheBustUrlsMatching))) {
      url.search += (url.search ? '&' : '') +
        encodeURIComponent(paramName) + '=' + encodeURIComponent(paramValue);
    }

    return url.toString();
  };

var isPathWhitelisted = function(whitelist, absoluteUrlString) {
    // If the whitelist is empty, then consider all URLs to be whitelisted.
    if (whitelist.length === 0) {
      return true;
    }

    // Otherwise compare each path regex to the path of the URL passed in.
    var path = (new URL(absoluteUrlString)).pathname;
    return whitelist.some(function(whitelistedPathRegex) {
      return path.match(whitelistedPathRegex);
    });
  };

var stripIgnoredUrlParameters = function(originalUrl,
    ignoreUrlParametersMatching) {
    var url = new URL(originalUrl);
    // Remove the hash; see https://github.com/GoogleChrome/sw-precache/issues/290
    url.hash = '';

    url.search = url.search.slice(1) // Exclude initial '?'
      .split('&') // Split into an array of 'key=value' strings
      .map(function(kv) {
        return kv.split('='); // Split each 'key=value' string into a [key, value] array
      })
      .filter(function(kv) {
        return ignoreUrlParametersMatching.every(function(ignoredRegex) {
          return !ignoredRegex.test(kv[0]); // Return true iff the key doesn't match any of the regexes.
        });
      })
      .map(function(kv) {
        return kv.join('='); // Join each [key, value] array into a 'key=value' string
      })
      .join('&'); // Join the array of 'key=value' strings into a string with '&' in between each

    return url.toString();
  };


var hashParamName = '_sw-precache';
var urlsToCacheKeys = new Map(
  precacheConfig.map(function(item) {
    var relativeUrl = item[0];
    var hash = item[1];
    var absoluteUrl = new URL(relativeUrl, self.location);
    var cacheKey = createCacheKey(absoluteUrl, hashParamName, hash, /\.\w{8}\./);
    return [absoluteUrl.toString(), cacheKey];
  })
);

function setOfCachedUrls(cache) {
  return cache.keys().then(function(requests) {
    return requests.map(function(request) {
      return request.url;
    });
  }).then(function(urls) {
    return new Set(urls);
  });
}

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return setOfCachedUrls(cache).then(function(cachedUrls) {
        return Promise.all(
          Array.from(urlsToCacheKeys.values()).map(function(cacheKey) {
            // If we don't have a key matching url in the cache already, add it.
            if (!cachedUrls.has(cacheKey)) {
              var request = new Request(cacheKey, {credentials: 'same-origin'});
              return fetch(request).then(function(response) {
                // Bail out of installation unless we get back a 200 OK for
                // every request.
                if (!response.ok) {
                  throw new Error('Request for ' + cacheKey + ' returned a ' +
                    'response with status ' + response.status);
                }

                return cleanResponse(response).then(function(responseToCache) {
                  return cache.put(cacheKey, responseToCache);
                });
              });
            }
          })
        );
      });
    }).then(function() {
      
      // Force the SW to transition from installing -> active state
      return self.skipWaiting();
      
    })
  );
});

self.addEventListener('activate', function(event) {
  var setOfExpectedUrls = new Set(urlsToCacheKeys.values());

  event.waitUntil(
    caches.open(cacheName).then(function(cache) {
      return cache.keys().then(function(existingRequests) {
        return Promise.all(
          existingRequests.map(function(existingRequest) {
            if (!setOfExpectedUrls.has(existingRequest.url)) {
              return cache.delete(existingRequest);
            }
          })
        );
      });
    }).then(function() {
      
      return self.clients.claim();
      
    })
  );
});


self.addEventListener('fetch', function(event) {
  if (event.request.method === 'GET') {
    // Should we call event.respondWith() inside this fetch event handler?
    // This needs to be determined synchronously, which will give other fetch
    // handlers a chance to handle the request if need be.
    var shouldRespond;

    // First, remove all the ignored parameters and hash fragment, and see if we
    // have that URL in our cache. If so, great! shouldRespond will be true.
    var url = stripIgnoredUrlParameters(event.request.url, ignoreUrlParametersMatching);
    shouldRespond = urlsToCacheKeys.has(url);

    // If shouldRespond is false, check again, this time with 'index.html'
    // (or whatever the directoryIndex option is set to) at the end.
    var directoryIndex = 'index.html';
    if (!shouldRespond && directoryIndex) {
      url = addDirectoryIndex(url, directoryIndex);
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond is still false, check to see if this is a navigation
    // request, and if so, whether the URL matches navigateFallbackWhitelist.
    var navigateFallback = '/index.html';
    if (!shouldRespond &&
        navigateFallback &&
        (event.request.mode === 'navigate') &&
        isPathWhitelisted(["^(?!\\/__).*"], event.request.url)) {
      url = new URL(navigateFallback, self.location).toString();
      shouldRespond = urlsToCacheKeys.has(url);
    }

    // If shouldRespond was set to true at any point, then call
    // event.respondWith(), using the appropriate cache key.
    // console.log("[SW] fetch url " + url, shouldRespond);
    if (shouldRespond) {
      event.respondWith(
        caches.open(cacheName).then(function(cache) {
          return cache.match(urlsToCacheKeys.get(url)).then(function(response) {
            if (response) {
              let url = event.request.url;
                // console.log("[SW] found cached url " + url);
                /*if (url.indexOf(".wasm") > -1) {
                  console.log("[SW] wasm not modified");
                  let responseInit = {
                    status: 304,
                    statusText: 'Not Modified'
                  };
                  let notModifiedResponse = new Response('', responseInit);
                  return notModifiedResponse;
                }*/

              return response;
            }
            throw Error('The cached response that was expected is missing.');
          });
        }).catch(function(e) {
          // Fall back to just fetch()ing the request if some unexpected error
          // prevented the cached response from being valid.
          console.warn('Couldn\'t serve response for "%s" from cache: %O', event.request.url, e);
          return fetch(event.request);
        })
      );
    }
  }
});







importScripts("./custom-service-worker.js");

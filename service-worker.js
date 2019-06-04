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

var precacheConfig = [["/telegram-react/04049015109083df5181f0ff52300b73.wasm","04049015109083df5181f0ff52300b73"],["/telegram-react/1.8a0dda0da6e695f9b779.worker.js","ff89e2c4eb8c6533c467dd2346b7854e"],["/telegram-react/8a0dda0da6e695f9b779.worker.js","14d5c9e298c83f6ffd1892524cb2373d"],["/telegram-react/emoji-mart.dark.css","28554b5527aad78e83ad831e4783b869"],["/telegram-react/emoji-mart.light.css","ccea21479255a2c507b55ff45778c102"],["/telegram-react/index.html","189dbafd6de829773881e59741ae7a61"],["/telegram-react/static/css/0.0b228b9d.chunk.css","88226c8200f424807bc98b261da5480b"],["/telegram-react/static/css/12.cd5aac47.chunk.css","36184f176864c9c873cdf4267257a69a"],["/telegram-react/static/css/13.7c1918f4.chunk.css","52665319fa58d88c9f43af819d315d9a"],["/telegram-react/static/css/15.542014fb.chunk.css","23d3688b0e6a482edcf634c11160ff15"],["/telegram-react/static/css/16.e689d479.chunk.css","42599048d220ba687ec755c203944e0d"],["/telegram-react/static/css/6.c8315c5a.chunk.css","bf7a2275bf9b6175c4b3e3534a790189"],["/telegram-react/static/css/7.3986d49f.chunk.css","fb2fa0a502862dc1408381fb2118f87d"],["/telegram-react/static/css/8.040051a9.chunk.css","0e890343157a58c10dbfd0e59973914c"],["/telegram-react/static/css/9.81c2d51b.chunk.css","ba9e230d58f9631dc9e7c0bea4f7bd2b"],["/telegram-react/static/css/main.913a3dcd.chunk.css","0b635ba5aa5e060a193ee81477228765"],["/telegram-react/static/js/0.a822b47d.chunk.js","1d982979375d49be77793ddb297e107f"],["/telegram-react/static/js/1.8af85fb8.chunk.js","a8e03665b3a4dfdf649d8941fe6bab14"],["/telegram-react/static/js/10.cc2a9ee8.chunk.js","f29968e79b9f9cb9e3a8664df12aa7ec"],["/telegram-react/static/js/11.5e335787.chunk.js","90bcbd9abb2dc3f157e17cb911253615"],["/telegram-react/static/js/12.64436f7f.chunk.js","24ad3765147be3bfe0342668a1ca69f9"],["/telegram-react/static/js/13.5a1b35ed.chunk.js","e0cc289a37a1e9b87729398c646ce945"],["/telegram-react/static/js/14.115574d2.chunk.js","ff8d26f1d2aa166bdeba40b058646755"],["/telegram-react/static/js/15.95ced415.chunk.js","64a75c4251cb7b96b781e05f697b2373"],["/telegram-react/static/js/16.da05a80d.chunk.js","f4fcca05c2f2575fdb4e52d350116258"],["/telegram-react/static/js/17.e530a1c4.chunk.js","ca87fb8a6b1df631724604e82e4fafba"],["/telegram-react/static/js/2.7763b2bf.chunk.js","48f834eba8e6f2488bf87fd1a6c6efad"],["/telegram-react/static/js/5.26ae8245.chunk.js","730990459675429949a77d893b205570"],["/telegram-react/static/js/6.1d607864.chunk.js","a4049517273c6af340813a9e422c675a"],["/telegram-react/static/js/7.a86dc84d.chunk.js","dffafb2f5b396062dd32f79c6a0e8618"],["/telegram-react/static/js/8.ef5978ba.chunk.js","1badc0ce00b9e556c8075eb37bc6fc9b"],["/telegram-react/static/js/9.d0a47dea.chunk.js","432f152df25ed749ce651f1041dff2a8"],["/telegram-react/static/js/main.18f3d7f7.chunk.js","04c50f27235bdbb87e3d0339676ed87e"],["/telegram-react/static/js/runtime~main.2ecbe24a.js","afd614de875b61cb9edbfca63b79cf1b"],["/telegram-react/static/media/General_2x.5270d71c.png","5270d71cd78fd282a3736b0e6ae7f048"],["/telegram-react/static/media/IconsetW_2x.f01cec9b.png","f01cec9bccc80a678ed0ec04acecade2"],["/telegram-react/static/media/Manytabs_2x.7a71629a.png","7a71629a5e4f7482b6320b103f1d543c"],["/telegram-react/static/media/Telegram.4964c9bb.svg","4964c9bbfba510f495319c52562d70d4"],["/telegram-react/static/media/check.71da7469.svg","71da74694e314a0e3a855ded564a1eaf"],["/telegram-react/tdweb.js","e1ed9d87707109c2255b6add47a6bc46"]];
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
    if (shouldRespond) {
      event.respondWith(
        caches.open(cacheName).then(function(cache) {
          return cache.match(urlsToCacheKeys.get(url)).then(function(response) {
            if (response) {
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


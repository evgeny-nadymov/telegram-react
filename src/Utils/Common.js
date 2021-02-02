/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { PHOTO_SIZE, PHOTO_THUMBNAIL_SIZE } from '../Constants';

let webpSupported = undefined;

export async function isWebpSupported() {
    // return false;

    if (webpSupported !== undefined) {
        return webpSupported;
    }

    const promise = new Promise(resolve => {
        const image = new Image();
        image.onload = function () {
            resolve(image.width === 2 && image.height === 1);
        }
        image.onerror = function () {
            resolve(false);
        }
        image.src = 'data:image/webp;base64,UklGRjIAAABXRUJQVlA4ICYAAACyAgCdASoCAAEALmk0mk0iIiIiIgBoSygABc6zbAAA/v56QAAAAA==';
    });

    return webpSupported = await promise;
}

export function isSafari() {
    return /(Safari|iPhone|iPad|iPod)/.test(navigator.userAgent)
        && !/Chrome/.test(navigator.userAgent)
        && !/BlackBerry/.test(navigator.platform);
}

export function mapEquals(map1, map2) {
    if (!map1 || !map2) return false;

    let testVal;
    if (map1.size !== map2.size) {
        return false;
    }

    for (let [key, val] of map1) {
        testVal = map2.get(key);
        // in cases of an undefined value, make sure the key
        // actually exists on the object so there are no false positives
        if (testVal !== val || (testVal === undefined && !map2.has(key))) {
            return false;
        }
    }
    return true;
}

export function isMobile() {
    return isAndroid() || isIOS() || isWindowsPhone();
}

export function isMacOS() {
    return navigator.platform.toLowerCase().indexOf('mac') >= 0;
}

export function isIOS() {
    const iDevices = ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod'];

    if (!!navigator.platform && iDevices.indexOf(navigator.platform) > -1) {
        return true;
    }

    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

export function isAndroid() {
    const ua = navigator.userAgent.toLowerCase();
    return ua.indexOf('android') > -1;
}

export function isWindowsPhone() {
    if (navigator.userAgent.match(/Windows Phone/i)) {
        return true;
    }

    if (navigator.userAgent.match(/iemobile/i)) {
        return true;
    }

    if (navigator.userAgent.match(/WPDesktop/i)) {
        return true;
    }

    return false;
}

function isAppleDevice() {
    const iDevices = ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod', 'MacIntel'];

    if (!!navigator.platform) {
        return iDevices.indexOf(navigator.platform) > -1;
    }

    return /iPad|iPhone|iPod|Mac\sOS\sX/.test(navigator.userAgent) && !window.MSStream;
}

function getOSName() {
    const { userAgent } = window.navigator;

    let OSName = 'Unknown';
    if (userAgent.indexOf('Windows NT 10.0') !== -1) OSName = 'Windows 10';
    if (userAgent.indexOf('Windows NT 6.2') !== -1) OSName = 'Windows 8';
    if (userAgent.indexOf('Windows NT 6.1') !== -1) OSName = 'Windows 7';
    if (userAgent.indexOf('Windows NT 6.0') !== -1) OSName = 'Windows Vista';
    if (userAgent.indexOf('Windows NT 5.1') !== -1) OSName = 'Windows XP';
    if (userAgent.indexOf('Windows NT 5.0') !== -1) OSName = 'Windows 2000';
    if (userAgent.indexOf('Mac') !== -1) OSName = 'Mac/iOS';
    if (userAgent.indexOf('X11') !== -1) OSName = 'UNIX';
    if (userAgent.indexOf('Linux') !== -1) OSName = 'Linux';

    return OSName;
}

function getBrowser() {
    const { userAgent } = window.navigator;

    let browser_name = '';
    let isIE = /*@cc_on!@*/ false || !!document.documentMode;
    let isEdge = !isIE && !!window.StyleMedia;
    if (userAgent.indexOf('Chrome') !== -1 && !isEdge) {
        browser_name = 'Chrome';
    } else if (userAgent.indexOf('Safari') !== -1 && !isEdge) {
        browser_name = 'Safari';
    } else if (userAgent.indexOf('Firefox') !== -1) {
        browser_name = 'Firefox';
    } else if (userAgent.indexOf('MSIE') !== -1 || !!document.documentMode === true) {
        //IF IE > 10
        browser_name = 'IE';
    } else if (isEdge) {
        browser_name = 'Edge';
    } else {
        browser_name = 'Unknown';
    }

    return browser_name;
}

function stringToBoolean(string) {
    switch (string.toLowerCase().trim()) {
        case 'true':
        case 'yes':
        case '1':
            return true;
        case 'false':
        case 'no':
        case '0':
        case null:
            return false;
        default:
            return Boolean(string);
    }
}

function orderCompare(order1, order2) {
    let diff = order1.length - order2.length;
    if (diff !== 0) return diff < 0 ? -1 : 1;
    if (order1 === order2) return 0;

    return order1 > order2 ? 1 : -1;
}

function getPhotoThumbnailSize(sizes) {
    return getSize(sizes, PHOTO_THUMBNAIL_SIZE);
}

function getPhotoSize(sizes, displaySize = PHOTO_SIZE) {
    return getSize(sizes, displaySize);
}

function getSize(sizes, dimension) {
    if (!sizes) return null;
    if (sizes.length === 0) return null;
    if (dimension === 0) return null;

    let iSize = sizes.find(x => x.type === 'i');
    if (iSize){
        return iSize;
    }

    let useWidth = sizes[0].width >= sizes[0].height;
    let diff = Math.abs(dimension - (useWidth ? sizes[0].width : sizes[0].height));
    let index = 0;
    for (let i = 1; i < sizes.length; i++) {
        if (!sizes[i]) {
            continue;
        }

        if (sizes[i].type === 'i' && !sizes[i].photo.local.is_downloading_completed) {
            continue;
        }

        let currDiff = Math.abs(dimension - (useWidth ? sizes[i].width : sizes[i].height));
        if (currDiff < diff) {
            index = i;
            currDiff = diff;
        }
    }

    return sizes[index];
}

function getFitSize(size, max, stretch = true) {
    if (!size) return { width: 0, height: 0 };

    if (!stretch) {
        if (size.width < max && size.height < max) {
            return size;
        }
    }

    if (size.width > size.height) {
        return { width: max, height: Math.floor((size.height * max) / size.width) };
    }

    return { width: Math.floor((size.width * max) / size.height), height: max };
}

function itemsInView(scrollContainerRef, itemsContainerRef) {
    const scrollContainer = scrollContainerRef.current;
    const itemsContainer = itemsContainerRef ? itemsContainerRef.current : scrollContainer;

    const items = [];
    for (let i = 0; i < itemsContainer.children.length; i++) {
        const child = itemsContainer.children[i];
        if (
            child.offsetTop + child.offsetHeight >= scrollContainer.scrollTop &&
            child.offsetTop <= scrollContainer.scrollTop + scrollContainer.offsetHeight
        ) {
            items.push(i);
        }
    }

    return items;
}

export function getScrollMessage(snapshot, itemsContainerRef) {
    if (!snapshot) return { index: -1, offset: 0 };

    const { current: itemsContainer } = itemsContainerRef;

    for (let i = 0; i < itemsContainer.children.length; i++) {
        const child = itemsContainer.children[i];
        const offsetTop = child.offsetTop;
        const scrollTop = snapshot.scrollTop;
        const offsetHeight = snapshot.offsetHeight;
        // console.log('[scroll] child', [i, offsetTop, child.offsetHeight, scrollTop]);

        if (offsetTop >= scrollTop && offsetTop <= scrollTop + offsetHeight) {
            return { index: i, offset: offsetTop - scrollTop, offsetTop, scrollTop };
        }
    }

    return { index: -1, offset: 0 };
}

// Returns a function, that, when invoked, will only be triggered at most once
// during a given window of time. Normally, the throttled function will run
// as much as it can, without ever going more than once per `wait` duration;
// but if you'd like to disable the execution on the leading edge, pass
// `{leading: false}`. To disable execution on the trailing edge, ditto.
function throttle(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
        previous = options.leading === false ? 0 : Date.now();
        timeout = null;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
    };
    return function() {
        var now = Date.now();
        if (!previous && options.leading === false) previous = now;
        var remaining = wait - (now - previous);
        context = this;
        args = arguments;
        if (remaining <= 0 || remaining > wait) {
            if (timeout) {
                clearTimeout(timeout);
                timeout = null;
            }
            previous = now;
            result = func.apply(context, args);
            if (!timeout) context = args = null;
        } else if (!timeout && options.trailing !== false) {
            timeout = setTimeout(later, remaining);
        }
        return result;
    };
}

function isObject(value) {
    const type = typeof value
    return value != null && (type === 'object' || type === 'function')
}


/**
 * Creates a debounced function that delays invoking `func` until after `wait`
 * milliseconds have elapsed since the last time the debounced function was
 * invoked, or until the next browser frame is drawn. The debounced function
 * comes with a `cancel` method to cancel delayed `func` invocations and a
 * `flush` method to immediately invoke them. Provide `options` to indicate
 * whether `func` should be invoked on the leading and/or trailing edge of the
 * `wait` timeout. The `func` is invoked with the last arguments provided to the
 * debounced function. Subsequent calls to the debounced function return the
 * result of the last `func` invocation.
 *
 * **Note:** If `leading` and `trailing` options are `true`, `func` is
 * invoked on the trailing edge of the timeout only if the debounced function
 * is invoked more than once during the `wait` timeout.
 *
 * If `wait` is `0` and `leading` is `false`, `func` invocation is deferred
 * until the next tick, similar to `setTimeout` with a timeout of `0`.
 *
 * If `wait` is omitted in an environment with `requestAnimationFrame`, `func`
 * invocation will be deferred until the next frame is drawn (typically about
 * 16ms).
 *
 * See [David Corbacho's article](https://css-tricks.com/debouncing-throttling-explained-examples/)
 * for details over the differences between `debounce` and `throttle`.
 *
 * @since 0.1.0
 * @category Function
 * @param {Function} func The function to debounce.
 * @param {number} [wait=0]
 *  The number of milliseconds to delay; if omitted, `requestAnimationFrame` is
 *  used (if available).
 * @param {Object} [options={}] The options object.
 * @param {boolean} [options.leading=false]
 *  Specify invoking on the leading edge of the timeout.
 * @param {number} [options.maxWait]
 *  The maximum time `func` is allowed to be delayed before it's invoked.
 * @param {boolean} [options.trailing=true]
 *  Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new debounced function.
 * @example
 *
 * // Avoid costly calculations while the window size is in flux.
 * jQuery(window).on('resize', debounce(calculateLayout, 150))
 *
 * // Invoke `sendMail` when clicked, debouncing subsequent calls.
 * jQuery(element).on('click', debounce(sendMail, 300, {
 *   'leading': true,
 *   'trailing': false
 * }))
 *
 * // Ensure `batchLog` is invoked once after 1 second of debounced calls.
 * const debounced = debounce(batchLog, 250, { 'maxWait': 1000 })
 * const source = new EventSource('/stream')
 * jQuery(source).on('message', debounced)
 *
 * // Cancel the trailing debounced invocation.
 * jQuery(window).on('popstate', debounced.cancel)
 *
 * // Check for pending invocations.
 * const status = debounced.pending() ? "Pending..." : "Ready"
 */
function debounce(func, wait, options) {
    let lastArgs,
        lastThis,
        maxWait,
        result,
        timerId,
        lastCallTime

    let lastInvokeTime = 0
    let leading = false
    let maxing = false
    let trailing = true

    // Bypass `requestAnimationFrame` by explicitly setting `wait=0`.
    const useRAF = (!wait && wait !== 0 && typeof requestAnimationFrame === 'function')

    if (typeof func !== 'function') {
        throw new TypeError('Expected a function')
    }
    wait = +wait || 0
    if (isObject(options)) {
        leading = !!options.leading
        maxing = 'maxWait' in options
        maxWait = maxing ? Math.max(+options.maxWait || 0, wait) : maxWait
        trailing = 'trailing' in options ? !!options.trailing : trailing
    }

    function invokeFunc(time) {
        const args = lastArgs
        const thisArg = lastThis

        lastArgs = lastThis = undefined
        lastInvokeTime = time
        result = func.apply(thisArg, args)
        return result
    }

    function startTimer(pendingFunc, wait) {
        if (useRAF) {
            cancelAnimationFrame(timerId)
            return requestAnimationFrame(pendingFunc)
        }
        return setTimeout(pendingFunc, wait)
    }

    function cancelTimer(id) {
        if (useRAF) {
            return cancelAnimationFrame(id)
        }
        clearTimeout(id)
    }

    function leadingEdge(time) {
        // Reset any `maxWait` timer.
        lastInvokeTime = time
        // Start the timer for the trailing edge.
        timerId = startTimer(timerExpired, wait)
        // Invoke the leading edge.
        return leading ? invokeFunc(time) : result
    }

    function remainingWait(time) {
        const timeSinceLastCall = time - lastCallTime
        const timeSinceLastInvoke = time - lastInvokeTime
        const timeWaiting = wait - timeSinceLastCall

        return maxing
            ? Math.min(timeWaiting, maxWait - timeSinceLastInvoke)
            : timeWaiting
    }

    function shouldInvoke(time) {
        const timeSinceLastCall = time - lastCallTime
        const timeSinceLastInvoke = time - lastInvokeTime

        // Either this is the first call, activity has stopped and we're at the
        // trailing edge, the system time has gone backwards and we're treating
        // it as the trailing edge, or we've hit the `maxWait` limit.
        return (lastCallTime === undefined || (timeSinceLastCall >= wait) ||
            (timeSinceLastCall < 0) || (maxing && timeSinceLastInvoke >= maxWait))
    }

    function timerExpired() {
        const time = Date.now()
        if (shouldInvoke(time)) {
            return trailingEdge(time)
        }
        // Restart the timer.
        timerId = startTimer(timerExpired, remainingWait(time))
    }

    function trailingEdge(time) {
        timerId = undefined

        // Only invoke if we have `lastArgs` which means `func` has been
        // debounced at least once.
        if (trailing && lastArgs) {
            return invokeFunc(time)
        }
        lastArgs = lastThis = undefined
        return result
    }

    function cancel() {
        if (timerId !== undefined) {
            cancelTimer(timerId)
        }
        lastInvokeTime = 0
        lastArgs = lastCallTime = lastThis = timerId = undefined
    }

    function flush() {
        return timerId === undefined ? result : trailingEdge(Date.now())
    }

    function pending() {
        return timerId !== undefined
    }

    function debounced(...args) {
        const time = Date.now()
        const isInvoking = shouldInvoke(time)

        lastArgs = args
        lastThis = this
        lastCallTime = time

        if (isInvoking) {
            if (timerId === undefined) {
                return leadingEdge(lastCallTime)
            }
            if (maxing) {
                // Handle invocations in a tight loop.
                timerId = startTimer(timerExpired, wait)
                return invokeFunc(lastCallTime)
            }
        }
        if (timerId === undefined) {
            timerId = startTimer(timerExpired, wait)
        }
        return result
    }
    debounced.cancel = cancel
    debounced.flush = flush
    debounced.pending = pending
    return debounced
}

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
// function debounce(func, wait, immediate) {
//     let timeout;
//     return function() {
//         const context = this, args = arguments;
//         const later = function() {
//             timeout = null;
//             if (!immediate) {
//                 func.apply(context, args);
//             }
//         };
//         const callNow = immediate && !timeout;
//         clearTimeout(timeout);
//         timeout = setTimeout(later, wait);
//         if (callNow) {
//             func.apply(context, args);
//         }
//     };
// }

export function getFirstLetter(str) {
    if (!str) return '';

    for (let char of str) {
        if (char.toUpperCase() !== char.toLowerCase()) {
            return char;
        } else if (char >= '0' && char <= '9') {
            return char;
        } else if (char.length > 1) {
            return char;
        }
    }

    return [...str].length > 0 ? [...str][0] : '';
}

function getLetters(title) {
    if (!title) return null;
    if (title.length === 0) return null;

    const split = title.split(' ');
    if (split.length === 1) {
        return getFirstLetter(split[0]);
    }
    if (split.length > 1) {
        return getFirstLetter(split[0]) + getFirstLetter(split[split.length - 1]);
    }

    return null;
}

async function readImageSize(file) {
    return new Promise((resolve, reject) => {
        let useBlob = false;
        const reader = new FileReader();

        reader.addEventListener('load', function() {
            try {
                const image = new Image();
                image.addEventListener('load', function() {
                    const { width, height } = image;
                    if (useBlob) {
                        window.URL.revokeObjectURL(image.src);
                    }

                    resolve([width, height]);
                });

                image.src = useBlob ? window.URL.createObjectURL(file) : reader.result;
            } catch {
                reject();
            }
        });

        reader.readAsDataURL(file);
    });
}

/**
 * use this to make a Base64 encoded string URL friendly,
 * i.e. '+' and '/' are replaced with '-' and '_' also any trailing '='
 * characters are removed
 *
 * @param {String} str the encoded string
 * @returns {String} the URL friendly encoded String
 */
function Base64EncodeUrl(str) {
    return str
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/\=+$/, '');
}

/**
 * Use this to recreate a Base64 encoded string that was made URL friendly
 * using Base64EncodeurlFriendly.
 * '-' and '_' are replaced with '+' and '/' and also it is padded with '+'
 *
 * @param {String} str the encoded string
 * @returns {String} the URL friendly encoded String
 */
function Base64DecodeUrl(str) {
    str = (str + '===').slice(0, str.length + (str.length % 4));
    return str.replace(/-/g, '+').replace(/_/g, '/');
}

function arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return Base64EncodeUrl(window.btoa(binary));
}

function isAuthorizationReady(state) {
    if (!state) return false;

    return state['@type'] === 'authorizationStateReady';
}

function between(item, first, last, inclusive = false) {
    return inclusive ? item >= first && item <= last : item > first && item < last;
}

function clamp(item, first, last) {
    if (item < first) return first;
    if (item > last) return last;

    return item;
}

function getDurationString(secondsTotal, duration, reverse) {
    if (reverse && duration > 0) {
        secondsTotal = Math.max(Math.floor(duration) - secondsTotal, 0);
    }

    let hours = Math.floor(secondsTotal / 3600);
    let minutes = Math.floor((secondsTotal - hours * 3600) / 60);
    let seconds = secondsTotal - hours * 3600 - minutes * 60;

    if (hours > 0 && minutes < 10) {
        minutes = '0' + minutes;
    }
    if (seconds < 10) {
        seconds = '0' + seconds;
    }

    return (reverse ? '-': '') + (hours > 0 ? hours + ':' : '') + minutes + ':' + seconds;
}

export function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}

function historyEquals(first, second) {
    if (!first && second) return false;
    if (first && !second) return false;

    if (!first && !second) return true;
    if (first.length === 0 && second.length === 0) return true;

    return first === second;
}

export function albumHistoryEquals(first, second) {
    if (first === second) return true;
    if (!first && second) return false;
    if (first && !second) return false;

    if (first.length === 0 && second.length === 0) return true;
    if (first.length !== second.length) return false;

    for (let i = 0; i < first.length; i++) {
        if (first[i] !== second[i]) {
            return false;
        }
    }

    return true;
}

function insertByOrder(array, element, comparator) {
    let i = 0;
    for (; i < array.length && comparator(array[i], element) < 0; i++) {}

    return [...array.slice(0, i), element, ...array.slice(i)];
}

export {
    getBrowser,
    getOSName,
    stringToBoolean,
    orderCompare,
    getSize,
    getPhotoThumbnailSize,
    getPhotoSize,
    getFitSize,
    itemsInView,
    throttle,
    debounce,
    getLetters,
    readImageSize,
    arrayBufferToBase64,
    isAuthorizationReady,
    between,
    clamp,
    getDurationString,
    isAppleDevice,
    historyEquals,
    insertByOrder
};

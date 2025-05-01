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

export function compareMaps(map1, map2) {
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
    // return false;
    return isAndroid() || isIOS() || isWindowsPhone();
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
    let OSName = 'Unknown';
    if (window.navigator.userAgent.indexOf('Windows NT 10.0') !== -1) OSName = 'Windows 10';
    if (window.navigator.userAgent.indexOf('Windows NT 6.2') !== -1) OSName = 'Windows 8';
    if (window.navigator.userAgent.indexOf('Windows NT 6.1') !== -1) OSName = 'Windows 7';
    if (window.navigator.userAgent.indexOf('Windows NT 6.0') !== -1) OSName = 'Windows Vista';
    if (window.navigator.userAgent.indexOf('Windows NT 5.1') !== -1) OSName = 'Windows XP';
    if (window.navigator.userAgent.indexOf('Windows NT 5.0') !== -1) OSName = 'Windows 2000';
    if (window.navigator.userAgent.indexOf('Mac') !== -1) OSName = 'Mac/iOS';
    if (window.navigator.userAgent.indexOf('X11') !== -1) OSName = 'UNIX';
    if (window.navigator.userAgent.indexOf('Linux') !== -1) OSName = 'Linux';

    return OSName;
}

function getBrowser() {
    let browser_name = '';
    let isIE = /*@cc_on!@*/ false || !!document.documentMode;
    let isEdge = !isIE && !!window.StyleMedia;
    if (navigator.userAgent.indexOf('Chrome') !== -1 && !isEdge) {
        browser_name = 'Chrome';
    } else if (navigator.userAgent.indexOf('Safari') !== -1 && !isEdge) {
        browser_name = 'Safari';
    } else if (navigator.userAgent.indexOf('Firefox') !== -1) {
        browser_name = 'Firefox';
    } else if (navigator.userAgent.indexOf('MSIE') !== -1 || !!document.documentMode === true) {
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

// Returns a function, that, as long as it continues to be invoked, will not
// be triggered. The function will be called after it stops being called for
// N milliseconds. If `immediate` is passed, trigger the function on the
// leading edge, instead of the trailing.
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this,
            args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) {
                func.apply(context, args);
            }
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) {
            func.apply(context, args);
        }
    };
}

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

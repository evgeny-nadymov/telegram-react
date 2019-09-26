/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { formatNumber } from 'libphonenumber-js';
import { PHOTO_SIZE, PHOTO_THUMBNAIL_SIZE } from '../Constants';

function isAppleDevice() {
    const iDevices = ['iPad Simulator', 'iPhone Simulator', 'iPod Simulator', 'iPad', 'iPhone', 'iPod', 'MacIntel'];

    if (!!navigator.platform) {
        return iDevices.indexOf(navigator.platform) > -1;
    }

    return /iPad|iPhone|iPod|Mac\sOS\sX/.test(navigator.userAgent) && !window.MSStream;
}

function isConnecting(state) {
    if (!state) return false;

    switch (state['@type']) {
        case 'connectionStateConnecting': {
            return true;
        }
        case 'connectionStateConnectingToProxy': {
            return true;
        }
        case 'connectionStateReady': {
            return false;
        }
        case 'connectionStateUpdating': {
            return false;
        }
        case 'connectionStateWaitingForNetwork': {
            return false;
        }
    }

    return false;
}

function cleanProgressStatus(status) {
    if (!status) return status;

    return status.replace('...', '').replace('…', '');
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

function isValidPhoneNumber(phoneNumber) {
    if (!phoneNumber) return false;

    let isBad = !phoneNumber.match(/^[\d\-+\s]+$/);
    if (!isBad) {
        phoneNumber = phoneNumber.replace(/\D/g, '');
        if (phoneNumber.length < 7) {
            isBad = true;
        }
    }

    return !isBad;
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

    // let iSize = sizes[2];//.find(x => x.type === 'i');
    // if (iSize){
    //     return iSize;
    // }

    let useWidth = sizes[0].width >= sizes[0].height;
    let diff = Math.abs(dimension - (useWidth ? sizes[0].width : sizes[0].height));
    let index = 0;
    for (let i = 1; i < sizes.length; i++) {
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

function getFitSize(size, max, increaseToMax = true) {
    if (!size) return { width: 0, height: 0 };

    if (!increaseToMax) {
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
    let scrollContainer = scrollContainerRef.current;
    let itemsContainer = itemsContainerRef ? itemsContainerRef.current : scrollContainer;

    const items = [];
    for (let i = 0; i < itemsContainer.children.length; i++) {
        let child = itemsContainer.children[i];
        if (
            child.offsetTop + child.offsetHeight >= scrollContainer.scrollTop &&
            child.offsetTop <= scrollContainer.scrollTop + scrollContainer.offsetHeight
        ) {
            items.push(i);
        }
    }

    return items;
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

function getFirstLetter(str) {
    if (!str) return '';
    for (let i = 0; i < str.length; i++) {
        if (str[i].toUpperCase() !== str[i].toLowerCase()) {
            return str[i];
        } else if (str[i] >= '0' && str[i] <= '9') {
            return str[i];
        }
    }

    return '';
}

function getLetters(title) {
    if (!title) return null;
    if (title.length === 0) return null;

    const split = title.split(' ');
    if (split.length > 1) {
        return getFirstLetter(split[0]) + getFirstLetter(split[1]);
    }

    return null;
}

function readImageSize(file, callback) {
    let useBlob = false;
    // Create a new FileReader instance
    // https://developer.mozilla.org/en/docs/Web/API/FileReader
    var reader = new FileReader();

    // Once a file is successfully readed:
    reader.addEventListener('load', function() {
        // At this point `reader.result` contains already the Base64 Data-URL
        // and we've could immediately show an image using
        // `elPreview.insertAdjacentHTML("beforeend", "<img src='"+ reader.result +"'>");`
        // But we want to get that image's width and height px values!
        // Since the File Object does not hold the size of an image
        // we need to create a new image and assign it's src, so when
        // the image is loaded we can calculate it's width and height:
        var image = new Image();
        image.addEventListener('load', function() {
            // Concatenate our HTML image info
            // var imageInfo = file.name    +' '+ // get the value of `name` from the `file` Obj
            //     image.width  +'×'+ // But get the width from our `image`
            //     image.height +' '+
            //     file.type    +' '+
            //     Math.round(file.size/1024) +'KB';

            //alert(imageInfo);
            file.photoWidth = image.width;
            file.photoHeight = image.height;
            // Finally append our created image and the HTML info string to our `#preview`
            //elPreview.appendChild( this );
            //elPreview.insertAdjacentHTML("beforeend", imageInfo +'<br>');

            // If we set the variable `useBlob` to true:
            // (Data-URLs can end up being really large
            // `src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAA...........etc`
            // Blobs are usually faster and the image src will hold a shorter blob name
            // src="blob:http%3A//example.com/2a303acf-c34c-4d0a-85d4-2136eef7d723"
            if (useBlob) {
                // Free some memory for optimal performance
                window.URL.revokeObjectURL(image.src);
            }

            callback(file);
        });

        image.src = useBlob ? window.URL.createObjectURL(file) : reader.result;
    });

    // https://developer.mozilla.org/en-US/docs/Web/API/FileReader/readAsDataURL
    reader.readAsDataURL(file);
}

function formatPhoneNumber(number) {
    const unformattedNumber = number && number.startsWith('+') ? number : '+' + number;
    const formattedNumber = formatNumber(unformattedNumber, 'International');
    return formattedNumber || unformattedNumber;
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

function getDurationString(secondsTotal) {
    let hours = Math.floor(secondsTotal / 3600);
    let minutes = Math.floor((secondsTotal - hours * 3600) / 60);
    let seconds = secondsTotal - hours * 3600 - minutes * 60;

    if (hours > 0 && minutes < 10) {
        minutes = '0' + minutes;
    }
    if (seconds < 10) {
        seconds = '0' + seconds;
    }

    return (hours > 0 ? hours + ':' : '') + minutes + ':' + seconds;
}

function getRandomInt(min, max) {
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
    cleanProgressStatus,
    isConnecting,
    getBrowser,
    getOSName,
    isValidPhoneNumber,
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
    formatPhoneNumber,
    arrayBufferToBase64,
    isAuthorizationReady,
    between,
    clamp,
    getDurationString,
    getRandomInt,
    isAppleDevice,
    historyEquals,
    insertByOrder
};

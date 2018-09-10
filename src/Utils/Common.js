import ReactDOM from 'react-dom';
import {PHOTO_SIZE} from '../Constants';

function orderCompare(order1, order2){
    let diff = order1.length - order2.length;
    if (diff !== 0) return diff < 0 ? -1 : 1;
    if (order1 === order2) return 0;

    return order1 > order2 ? 1 : -1;
}

function getPhotoSize(sizes){
    return getSize(sizes, PHOTO_SIZE);
}

function getSize(sizes, dimension) {
    if (!sizes) return null;
    if (sizes.length === 0) return null;

    let useWidth = sizes[0].width >= sizes[0].height;
    let diff = Math.abs(dimension - (useWidth ? sizes[0].width : sizes[0].height));
    let index = 0;
    for (let i = 1; i < sizes.length; i++){
        let currDiff = Math.abs(dimension - (useWidth ? sizes[i].width : sizes[i].height));
        if (currDiff < diff){
            index = i;
            currDiff = diff;
        }
    }

    return sizes[index];
}

function getFitSize(size, max) {
    if (!size) return { width: 0, height: 0 };

    if (size.width > size.height){
        return {width: max, height: Math.floor(size.height * max / size.width)};
    }

    return {width: Math.floor(size.width * max / size.height), height: max};
}

function itemsInView(scrollContainerRef, itemsContainerRef){
    let scrollContainer = scrollContainerRef.current; //ReactDOM.findDOMNode(scrollContainerRef);
    let itemsContainer =
        itemsContainerRef ?
            itemsContainerRef.current : //ReactDOM.findDOMNode(itemsContainerRef) :
            scrollContainer;

    let items = [];
    for(let i = 0; i < itemsContainer.children.length; i++){
        let child = itemsContainer.children[i];
        if (child.offsetTop + child.offsetHeight >= scrollContainer.scrollTop
            && child.offsetTop <= scrollContainer.scrollTop + scrollContainer.offsetHeight) {
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
        var context = this, args = arguments;
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

function getFirstLetter(str){
    if (!str) return '';
    for (let i = 0; i < str.length; i++){
        if (str[i].toUpperCase() !== str[i].toLowerCase()) {
            return str[i];
        }
        else if (str[i] >= '0' && str[i] <= '9'){
            return str[i];
        }
    }

    return '';
}

function getLetters(title){
    if (!title) return null;
    if (title.length === 0) return null;

    let split = title.split(' ');
    if (split.length > 1){
        return getFirstLetter(split[0]) + getFirstLetter(split[1])
    }

    return null;
}

export {orderCompare, getSize, getPhotoSize, getFitSize, itemsInView, throttle, debounce, getLetters};
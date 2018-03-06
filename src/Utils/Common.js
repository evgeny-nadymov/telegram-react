import ReactDOM from "react-dom";

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
    let scrollContainer = ReactDOM.findDOMNode(scrollContainerRef);
    let itemsContainer = itemsContainerRef ? ReactDOM.findDOMNode(itemsContainerRef) : scrollContainer;

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
export {getSize, getFitSize, itemsInView, throttle};
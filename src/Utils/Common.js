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

export {getSize, getFitSize};
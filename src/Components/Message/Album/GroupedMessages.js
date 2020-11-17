/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

/// based on https://github.com/evgeny-nadymov/telegram-wp/blob/master/TelegramClient.WP81/Views/Controls/GroupedMessages.cs

const POSITION_FLAG_LEFT = 1;
const POSITION_FLAG_RIGHT = 2;
const POSITION_FLAG_TOP = 4;
const POSITION_FLAG_BOTTOM = 8;

class MessageGroupedLayoutAttempt {
    constructor(lineCounts, heights) {
        this.lineCounts = lineCounts;
        this.heights = heights;
    }
}

class GroupedMessagePosition {
    aspectRatio;
    isEdge;
    flags;
    isLast;
    leftSpanOffset;
    minX;
    maxX;
    minY;
    maxY;
    height;
    width;
    siblingHeights;
    spanSize;

    set(minX, maxX, minY, maxY, w, h, flags) {
        this.minX = minX;
        this.maxX = maxX;
        this.minY = minY;
        this.maxY = maxY;
        this.spanSize = w;
        this.width = w;
        this.height = h;
        this.flags = flags;
    }

    getInfo() {
        return `minX=${this.minX}\nmaxX=${this.maxX}\nminY=${this.minY}\nmaxY=${this.maxY}\nspanSize=${this.spanSize}\nwidth=${this.width}\nheight=${this.height}\nflags=${this.flags}\nsiblingHeights=${this.siblingHeights}\nleftSpanOffset=${this.leftSpanOffset}`;
    }
}

class GroupedMessages {

    constructor() {
        this.posArray = [];
        this.positions = new Map();
        this.maxSizeWidth = 800;
        this.hasSibling = false;
        this.scale = 1.0;
    }

    multiHeight(array, start, end) {
        let sum = 0.0;
        for (let i = start; i < end; i++) {
            sum += array[i];
        }

        return 800.0 * this.scale / sum;
    }

    calculate(messages, desiredWidth) {
        this.posArray = [];
        this.positions = new Map();
        this.messages = messages;

        if (!messages) return;
        const { length } = messages;
        if (length <= 1) {
            return;
        }

        this.totalWidth = 0;
        this.totalHeight = 0.0;

        this.scale = desiredWidth / this.maxSizeWidth;
        this.maxSizeWidth = desiredWidth;

        const firstSpanAdditionalSize = Math.trunc(200 * this.scale);
        const minHeight = Math.trunc(120 * this.scale);
        const minWidth = Math.trunc(96 * this.scale);
        const paddingsWidth = Math.trunc(32 * this.scale);
        const maxSizeHeight = 814.0 * this.scale;
        let averageAspectRatio = 1.0;
        let proportions = '';
        const isOut = false;
        let maxX = 0;
        let forceCalc = false;

        for (let i = 0; i < length; i++) {
            const message = messages[i];
            const { w, h } = GroupedMessages.getWidthHeight(message);

            const position = new GroupedMessagePosition();
            position.isLast = i === messages.length - 1;
            position.aspectRatio = w / h;
            if (position.aspectRatio > 1.2) {
                proportions += 'w';
            } else if (position.aspectRatio < 0.8) {
                proportions += 'n';
            } else {
                proportions += 'q';
            }

            averageAspectRatio += position.aspectRatio;
            if (position.aspectRatio > 2.0) {
                forceCalc = true;
            }

            this.positions.set(message, position);
            this.posArray.push(position);
        }

        const maxAspectRation = this.maxSizeWidth / maxSizeHeight;
        averageAspectRatio = averageAspectRatio / length;

        if (!forceCalc && (length === 2 || length === 3 || length === 4)){
            switch (length) {
                case 2: {
                    const position1 = this.posArray[0];
                    const position2 = this.posArray[1];

                    if (proportions === 'ww' && averageAspectRatio > 1.4 * maxAspectRation && position1.aspectRatio - position2.aspectRatio < 0.2) {
                        const height = Math.round(Math.min(this.maxSizeWidth / position1.aspectRatio, Math.min(this.maxSizeWidth / position2.aspectRatio, maxSizeHeight / 2.0))) / maxSizeHeight;
                        position1.set(0, 0, 0, 0, this.maxSizeWidth, height, POSITION_FLAG_LEFT | POSITION_FLAG_RIGHT | POSITION_FLAG_TOP);
                        position2.set(0, 0, 1, 1, this.maxSizeWidth, height, POSITION_FLAG_LEFT | POSITION_FLAG_RIGHT | POSITION_FLAG_BOTTOM);

                        this.totalWidth = this.maxSizeWidth;
                        this.totalHeight = height * 2;
                    } else if (proportions === 'ww' || proportions === 'qq') {
                        const width = this.maxSizeWidth / 2;
                        const height = Math.round(Math.min(width / position1.aspectRatio, Math.min(width / position2.aspectRatio, maxSizeHeight))) / maxSizeHeight;
                        position1.set(0, 0, 0, 0, width, height, POSITION_FLAG_LEFT | POSITION_FLAG_BOTTOM | POSITION_FLAG_TOP);
                        position2.set(1, 1, 0, 0, width, height, POSITION_FLAG_RIGHT | POSITION_FLAG_BOTTOM | POSITION_FLAG_TOP);
                        maxX = 1;

                        this.totalWidth = width + width;
                        this.totalHeight = height;
                    } else {
                        let secondWidth = Math.max(0.4 * this.maxSizeWidth, Math.round((this.maxSizeWidth / position1.aspectRatio / (1.0 / position1.aspectRatio + 1.0 / position2.aspectRatio))));
                        let firstWidth = this.maxSizeWidth - secondWidth;
                        if (firstWidth < minWidth) {
                            const diff = minWidth - firstWidth;
                            firstWidth = minWidth;
                            secondWidth -= diff;
                        }

                        const height = Math.min(maxSizeHeight, Math.round(Math.min(firstWidth / position1.aspectRatio, secondWidth / position2.aspectRatio))) / maxSizeHeight;
                        position1.set(0, 0, 0, 0, firstWidth, height, POSITION_FLAG_LEFT | POSITION_FLAG_BOTTOM | POSITION_FLAG_TOP);
                        position2.set(1, 1, 0, 0, secondWidth, height, POSITION_FLAG_RIGHT | POSITION_FLAG_BOTTOM | POSITION_FLAG_TOP);
                        maxX = 1;

                        this.totalWidth = firstWidth + secondWidth;
                        this.totalHeight = height;
                    }

                    break;
                }
                case 3: {
                    const position1 = this.posArray[0];
                    const position2 = this.posArray[1];
                    const position3 = this.posArray[2];
                    if (proportions[0] === 'n')
                    {
                        const thirdHeight = Math.min(maxSizeHeight * 0.5, Math.round(position2.aspectRatio * this.maxSizeWidth / (position3.aspectRatio + position2.aspectRatio)));
                        const secondHeight = maxSizeHeight - thirdHeight;
                        const rightWidth = Math.max(minWidth, Math.min(this.maxSizeWidth * 0.5, Math.round(Math.min(thirdHeight * position3.aspectRatio, secondHeight * position2.aspectRatio))));

                        const leftWidth = Math.round(Math.min(maxSizeHeight * position1.aspectRatio + paddingsWidth, this.maxSizeWidth - rightWidth));
                        position1.set(0, 0, 0, 1, leftWidth, 1.0, POSITION_FLAG_LEFT | POSITION_FLAG_BOTTOM | POSITION_FLAG_TOP);
                        position2.set(1, 1, 0, 0, rightWidth, secondHeight / maxSizeHeight, POSITION_FLAG_RIGHT | POSITION_FLAG_TOP);
                        position3.set(0, 1, 1, 1, rightWidth, thirdHeight / maxSizeHeight, POSITION_FLAG_RIGHT | POSITION_FLAG_BOTTOM);
                        position3.spanSize = this.maxSizeWidth;

                        position1.siblingHeights = [thirdHeight / maxSizeHeight, secondHeight / maxSizeHeight];

                        if (isOut) {
                            position1.spanSize = this.maxSizeWidth - rightWidth;
                        } else {
                            position2.spanSize = this.maxSizeWidth - leftWidth;
                            position3.leftSpanOffset = leftWidth;
                        }
                        this.hasSibling = true;
                        maxX = 1;

                        this.totalWidth = leftWidth + rightWidth;
                        this.totalHeight = 1.0;
                    }
                    else
                    {
                        const firstHeight = Math.round(Math.min(this.maxSizeWidth / position1.aspectRatio, (maxSizeHeight) * 0.66)) / maxSizeHeight;
                        position1.set(0, 1, 0, 0, this.maxSizeWidth, firstHeight, POSITION_FLAG_LEFT | POSITION_FLAG_RIGHT | POSITION_FLAG_TOP);

                        const width = this.maxSizeWidth / 2;
                        const secondHeight = Math.min(maxSizeHeight - firstHeight, Math.round(Math.min(width / position2.aspectRatio, width / position3.aspectRatio))) / maxSizeHeight;
                        position2.set(0, 0, 1, 1, width, secondHeight, POSITION_FLAG_LEFT | POSITION_FLAG_BOTTOM);
                        position3.set(1, 1, 1, 1, width, secondHeight, POSITION_FLAG_RIGHT | POSITION_FLAG_BOTTOM);
                        maxX = 1;

                        this.totalWidth = this.maxSizeWidth;
                        this.totalHeight = firstHeight + secondHeight;
                    }

                    break;
                }
                case 4: {
                    const position1 = this.posArray[0];
                    const position2 = this.posArray[1];
                    const position3 = this.posArray[2];
                    const position4 = this.posArray[3];
                    if (proportions[0] === 'w') {
                        const h0 = Math.round(Math.min(this.maxSizeWidth / position1.aspectRatio, maxSizeHeight * 0.66)) / maxSizeHeight;
                        position1.set(0, 2, 0, 0, this.maxSizeWidth, h0, POSITION_FLAG_LEFT | POSITION_FLAG_RIGHT | POSITION_FLAG_TOP);

                        let h = Math.round(this.maxSizeWidth / (position2.aspectRatio + position3.aspectRatio + position4.aspectRatio));
                        const w0 = Math.max(minWidth, Math.min(this.maxSizeWidth * 0.4, h * position2.aspectRatio));
                        const w2 = Math.max(Math.max(minWidth, this.maxSizeWidth * 0.33), h * position4.aspectRatio);
                        const w1 = this.maxSizeWidth - w0 - w2;
                        h = Math.min(maxSizeHeight - h0, h);
                        h /= maxSizeHeight;
                        position2.set(0, 0, 1, 1, w0, h, POSITION_FLAG_LEFT | POSITION_FLAG_BOTTOM);
                        position3.set(1, 1, 1, 1, w1, h, POSITION_FLAG_BOTTOM);
                        position4.set(2, 2, 1, 1, w2, h, POSITION_FLAG_RIGHT | POSITION_FLAG_BOTTOM);
                        maxX = 2;

                        this.totalWidth = this.maxSizeWidth;
                        this.totalHeight = h0 + h;
                    } else {
                        const w = Math.max(minWidth, Math.round(maxSizeHeight / (1.0 / position2.aspectRatio + 1.0 / position3.aspectRatio + 1.0 / position4.aspectRatio)));
                        const h0 = Math.min(0.33, Math.max(minHeight, w / position2.aspectRatio) / maxSizeHeight);
                        const h1 = Math.min(0.33, Math.max(minHeight, w / position3.aspectRatio) / maxSizeHeight);
                        const h2 = 1.0 - h0 - h1;
                        const w0 = Math.round(Math.min(maxSizeHeight * position1.aspectRatio + paddingsWidth, this.maxSizeWidth - w));

                        position1.set(0, 0, 0, 2, w0, h0 + h1 + h2, POSITION_FLAG_LEFT | POSITION_FLAG_TOP | POSITION_FLAG_BOTTOM);
                        position2.set(1, 1, 0, 0, w, h0, POSITION_FLAG_RIGHT | POSITION_FLAG_TOP);
                        position3.set(0, 1, 1, 1, w, h1, POSITION_FLAG_RIGHT);
                        position3.spanSize = this.maxSizeWidth;
                        position4.set(0, 1, 2, 2, w, h2, POSITION_FLAG_RIGHT | POSITION_FLAG_BOTTOM);
                        position4.spanSize = this.maxSizeWidth;

                        if (isOut) {
                            position1.spanSize = this.maxSizeWidth - w;
                        } else {
                            position2.spanSize = this.maxSizeWidth - w0;
                            position3.leftSpanOffset = w0;
                            position4.leftSpanOffset = w0;
                        }
                        position1.siblingHeights = [ h0, h1, h2 ];
                        this.hasSibling = true;
                        maxX = 1;

                        this.totalWidth = w + w0;
                        this.totalHeight = h0 + h1 + h2;
                    }
                    break;
                }
            }
        } else {
            const croppedRatios = new Array(this.posArray.length);
            for (let i = 0; i < length; i++) {
                if (averageAspectRatio > 1.1) {
                    croppedRatios[i] = Math.max(1.0, this.posArray[i].aspectRatio);
                } else {
                    croppedRatios[i] = Math.min(1.0, this.posArray[i].aspectRatio);
                }
                croppedRatios[i] = Math.max(0.66667, Math.min(1.7, croppedRatios[i]));
            }

            let firstLine;
            let secondLine;
            let thirdLine;
            let fourthLine;
            const attempts = [];
            for (firstLine = 1; firstLine < croppedRatios.length; firstLine++) {
                secondLine = croppedRatios.length - firstLine;
                if (firstLine > 3 || secondLine > 3) {
                    continue;
                }
                attempts.push(new MessageGroupedLayoutAttempt([firstLine, secondLine], [this.multiHeight(croppedRatios, 0, firstLine), this.multiHeight(croppedRatios, firstLine, croppedRatios.length)]));
            }

            for (firstLine = 1; firstLine < croppedRatios.length - 1; firstLine++) {
                for (secondLine = 1; secondLine < croppedRatios.length - firstLine; secondLine++) {
                    thirdLine = croppedRatios.length - firstLine - secondLine;
                    if (firstLine > 3 || secondLine > (averageAspectRatio < 0.85 ? 4 : 3) || thirdLine > 3) {
                        continue;
                    }
                    attempts.push(new MessageGroupedLayoutAttempt([firstLine, secondLine, thirdLine], [this.multiHeight(croppedRatios, 0, firstLine), this.multiHeight(croppedRatios, firstLine, firstLine + secondLine), this.multiHeight(croppedRatios, firstLine + secondLine, croppedRatios.length)]));
                }
            }

            for (firstLine = 1; firstLine < croppedRatios.length - 2; firstLine++) {
                for (secondLine = 1; secondLine < croppedRatios.length - firstLine; secondLine++) {
                    for (thirdLine = 1; thirdLine < croppedRatios.length - firstLine - secondLine; thirdLine++) {
                        fourthLine = croppedRatios.length - firstLine - secondLine - thirdLine;
                        if (firstLine > 3 || secondLine > 3 || thirdLine > 3 || fourthLine > 3) {
                            continue;
                        }
                        attempts.push(new MessageGroupedLayoutAttempt([firstLine, secondLine, thirdLine, fourthLine], [this.multiHeight(croppedRatios, 0, firstLine), this.multiHeight(croppedRatios, firstLine, firstLine + secondLine), this.multiHeight(croppedRatios, firstLine + secondLine, firstLine + secondLine + thirdLine), this.multiHeight(croppedRatios, firstLine + secondLine + thirdLine, croppedRatios.length)]));
                    }
                }
            }

            let optimal = null;
            let optimalDiff = 0.0;
            let maxHeight = this.maxSizeWidth / 3 * 4;
            for (let i = 0; i < attempts.length; i++) {
                const attempt = attempts[i];
                let height = 0;
                let minLineHeight = Number.MAX_VALUE;
                for (let j = 0; j < attempt.heights.length; j++) {
                    height += attempt.heights[j];
                    if (attempt.heights[j] < minLineHeight) {
                        minLineHeight = attempt.heights[j];
                    }
                }

                let diff = Math.abs(height - maxHeight);
                if (attempt.lineCounts.length > 1) {
                    if (attempt.lineCounts[0] > attempt.lineCounts[1] || (attempt.lineCounts.length > 2 && attempt.lineCounts[1] > attempt.lineCounts[2]) || (attempt.lineCounts.length > 3 && attempt.lineCounts[2] > attempt.lineCounts[3])) {
                        diff *= 1.5;
                    }
                }

                if (minLineHeight < minWidth) {
                    diff *= 1.5;
                }

                if (optimal === null || diff < optimalDiff) {
                    optimal = attempt;
                    optimalDiff = diff;
                }
            }

            if (optimal === null) {
                return;
            }

            let index = 0;
            let y = 0.0;

            for (let i = 0; i < optimal.lineCounts.length; i++) {
                let c = optimal.lineCounts[i];
                let lineHeight = optimal.heights[i];
                let spanLeft = this.maxSizeWidth;
                let posToFix = null;
                maxX = Math.max(maxX, c - 1);
                for (let j = 0; j < c; j++) {
                    let ratio = croppedRatios[index];
                    let width = Math.trunc(ratio * lineHeight);
                    spanLeft -= width;
                    let pos = this.posArray[index];
                    let flags = 0;
                    if (i === 0) {
                        flags |= POSITION_FLAG_TOP;
                    }
                    if (i === optimal.lineCounts.length - 1) {
                        flags |= POSITION_FLAG_BOTTOM;
                    }
                    if (j === 0) {
                        flags |= POSITION_FLAG_LEFT;
                        if (isOut) {
                            posToFix = pos;
                        }
                    }
                    if (j === c - 1) {
                        flags |= POSITION_FLAG_RIGHT;
                        if (!isOut) {
                            posToFix = pos;
                        }
                    }
                    pos.set(j, j, i, i, width, lineHeight / maxSizeHeight, flags);
                    index++;
                }
                posToFix.width += spanLeft;
                posToFix.spanSize += spanLeft;
                y += lineHeight;
            }

            this.totalWidth = this.maxSizeWidth;
            this.totalHeight = y / maxSizeHeight;
        }
    }

    static getWidthHeight(message) {
        let w = 0;
        let h = 0;
        let sizes = [];
        switch (message.content['@type']){
            case 'messagePhoto': {
                const { photo, minithumbnail } = message.content;
                if (photo) {
                    sizes = photo.sizes;
                } else if (minithumbnail) {
                    sizes.push(minithumbnail);
                }

                break;
            }
            case 'messageVideo': {
                const { video, thumbnail, minithumbnail } = message.content;
                if (video) {
                    const { width, height } = video;
                    sizes.push({ width, height });
                } else if (minithumbnail) {
                    sizes.push(minithumbnail);
                } else if (thumbnail) {
                    sizes.push(thumbnail);
                }

                break;
            }
            case 'messageDocument': {
                const { thumbnail, minithumbnail } = message.content;
                if (minithumbnail) {
                    sizes.push(minithumbnail);
                } else if (thumbnail) {
                    sizes.push(thumbnail);
                } else {
                    sizes.push({ width: 90, height: 90 });
                }

                break;
            }
        }

        const photoSize = GroupedMessages.getPhotoSize(sizes, 1280);
        if (photoSize) {
            w = photoSize.width;
            h = photoSize.height;
        }

        return { w, h };
    }

    static getPhotoSize(sizes, side, byMinSize) {
        if (!sizes || !sizes.length) return null;

        let lastSide = 0;
        let lastSize = null;
        for (let i = 0; i < sizes.length; i++) {
            const { width: w, height: h } = sizes[i];

            if (byMinSize) {
                const currentSide = h >= w ? w : h;
                if (!lastSize || (side > 100 && side > lastSide && lastSide < currentSide)) {
                    lastSide = currentSide;
                    lastSize = sizes[i];
                }

            } else {
                const currentSide = w >= h ? w : h;
                if (!lastSize || (side > 100 && currentSide <= side && lastSide < currentSide)) {
                    lastSide = currentSide;
                    lastSize = sizes[i];
                }
            }
        }

        return lastSize;
    }
}

export default GroupedMessages;

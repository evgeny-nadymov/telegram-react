/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { hasID3v1Header, ID3v1Parser } from './ID3v1/ID3v1Parser';
import { hasID3v2Header, ID3v2Parser } from './ID3v2/ID3v2Parser';
import { getArrayBuffer } from '../../../../Utils/File';

export class ID3Parser {

    async parse(file) {
        const tags = { artist: '', title: '' };
        const result = { tags };

        if (!file) return result;

        const arrayBuffer = await getArrayBuffer(file);
        if (!arrayBuffer) return result;

        const buffer = new Uint8Array(arrayBuffer);
        if (!buffer) return result;

        if (hasID3v2Header(buffer)) {
            const id3Tags = new ID3v2Parser().parse(buffer);
            if (id3Tags) {
                const artistTag = id3Tags.find(x => x.id === 'TPE1');
                if (artistTag && artistTag.value.length > 0){
                    tags.artist = artistTag.value[0];
                }
                const titleTag = id3Tags.find(x => x.id === 'TIT2');
                if (titleTag && titleTag.value.length > 0){
                    tags.title = titleTag.value[0];
                }
            }
        } else if (hasID3v1Header(buffer)) {
            const id3Tags = new ID3v1Parser().parse(buffer);

            if (id3Tags) {
                tags.artist = id3Tags.artist;
                tags.title = id3Tags.title;
            }
        }

        return result;
    }
}
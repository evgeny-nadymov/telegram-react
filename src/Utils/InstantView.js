/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import Anchor from '../Components/InstantView/Blocks/Anchor';
import Animation from '../Components/InstantView/Blocks/Animation';
import AuthorDate from '../Components/InstantView/Blocks/AuthorDate';
import BlockQuote from '../Components/InstantView/Blocks/Blockquote';
import Collage from '../Components/InstantView/Blocks/Collage';
import Cover from '../Components/InstantView/Blocks/Cover';
import Details from '../Components/InstantView/Blocks/Details';
import Divider from '../Components/InstantView/Blocks/Divider';
import Embedded from '../Components/InstantView/Blocks/Embedded';
import EmbeddedPost from '../Components/InstantView/Blocks/EmbeddedPost';
import ErrorHandler from '../Components/InstantView/Blocks/ErrorHandler';
import Footer from '../Components/InstantView/Blocks/Footer';
import Header from '../Components/InstantView/Blocks/Header';
import Kicker from '../Components/InstantView/Blocks/Kicker';
import List from '../Components/InstantView/Blocks/List';
import ListItem from '../Components/InstantView/Blocks/ListItem';
import Paragraph from '../Components/InstantView/Blocks/Paragraph';
import Photo from '../Components/InstantView/Blocks/Photo';
import Preformatted from '../Components/InstantView/Blocks/Preformatted';
import PullQuote from '../Components/InstantView/Blocks/PullQuote';
import RelatedArticle from '../Components/InstantView/Blocks/RelatedArticle';
import RelatedArticles from '../Components/InstantView/Blocks/RelatedArticles';
import Slideshow from '../Components/InstantView/Blocks/Slideshow';
import Subheader from '../Components/InstantView/Blocks/Subheader';
import Subtitle from '../Components/InstantView/Blocks/Subtitle';
import Title from '../Components/InstantView/Blocks/Title';
import Bold from '../Components/InstantView/RichText/Bold';
import EmailAddress from '../Components/InstantView/RichText/EmailAddress';
import Fixed from '../Components/InstantView/RichText/Fixed';
import Icon from '../Components/InstantView/RichText/Icon';
import Italic from '../Components/InstantView/RichText/Italic';
import Marked from '../Components/InstantView/RichText/Marked';
import PhoneNumber from '../Components/InstantView/RichText/PhoneNumber';
import Plain from '../Components/InstantView/RichText/Plain';
import Strikethrough from '../Components/InstantView/RichText/Strikethrough';
import Subscript from '../Components/InstantView/RichText/Subscript';
import Superscript from '../Components/InstantView/RichText/Superscript';
import TextAnchor from '../Components/InstantView/RichText/Anchor';
import Texts from '../Components/InstantView/RichText/Texts';
import Underline from '../Components/InstantView/RichText/Underline';
import Url from '../Components/InstantView/RichText/Url';
import Table from '../Components/InstantView/Blocks/Table';
import TableCell from '../Components/InstantView/Blocks/TableCell';
import Map from '../Components/InstantView/Blocks/Map';
import Audio from '../Components/InstantView/Blocks/Audio';
import ChatLink from '../Components/InstantView/Blocks/ChatLink';
import Video from '../Components/InstantView/Blocks/Video';
import VoiceNote from '../Components/InstantView/Blocks/VoiceNote';
import { download, supportsStreaming } from './File';
import { setInstantViewViewerContent } from '../Actions/Client';
import FileStore from '../Stores/FileStore';
import TdLibController from '../Controllers/TdLibController';

export function getBlockAudio(block) {
    if (!block) return null;
    if (block['@type'] !== 'pageBlockAudio') return null;

    return block.audio;
}

export function openInstantViewMedia(media, caption, block, instantView, fileCancel) {
    // console.log('[IV] openIVMedia', media);

    if (!media) return;

    const chatId = 0;
    const messageId = 0;

    switch (media['@type']) {
        case 'animation': {
            let { animation: file } = media;
            if (!file) return;

            file = FileStore.get(file.id) || file;
            if (fileCancel && file.local.is_downloading_active) {
                FileStore.cancelGetRemoteFile(file.id, media);
                return;
            } else if (fileCancel && file.remote.is_uploading_active) {
                FileStore.cancelUploadFile(file.id, media);
                return;
            } else {
                download(file, media, () => FileStore.updateAnimationBlob(chatId, messageId, file.id));
            }

            setInstantViewViewerContent({
                media,
                caption,
                block,
                instantView
            });
            break;
        }
        case 'audio': {
            let { audio: file } = media;
            if (!file) return;

            file = FileStore.get(file.id) || file;
            if (fileCancel && file.local.is_downloading_active && !supportsStreaming()) {
                FileStore.cancelGetRemoteFile(file.id, media);
                return;
            } else if (fileCancel && file.remote.is_uploading_active) {
                FileStore.cancelUploadFile(file.id, media);
                return;
            } else {
                if (!supportsStreaming()) {
                    download(file, media, () => FileStore.updateAudioBlob(chatId, messageId, file.id));
                }
            }

            TdLibController.clientUpdate({
                '@type': 'clientUpdateMediaActive',
                source: {
                    '@type': 'instantViewSource',
                    instantView,
                    block
                }
            });
            break;
        }
        case 'photo': {
            setInstantViewViewerContent({
                media,
                caption,
                block,
                instantView
            });
            break;
        }
        case 'video': {
            let { video: file } = media;
            if (!file) return;

            file = FileStore.get(file.id) || file;
            if (fileCancel && file.local.is_downloading_active) {
                FileStore.cancelGetRemoteFile(file.id, media);
                return;
            } else if (fileCancel && file.remote.is_uploading_active) {
                FileStore.cancelUploadFile(file.id, media);
                return;
            } else {
                download(file, media, () => FileStore.updateVideoBlob(chatId, messageId, file.id));
            }

            setInstantViewViewerContent({
                media,
                caption,
                block,
                instantView
            });
            break;
        }
        case 'voiceNote': {
            let { voice: file } = media;
            if (!file) return;

            file = FileStore.get(file.id) || file;
            if (fileCancel && file.local.is_downloading_active) {
                FileStore.cancelGetRemoteFile(file.id, media);
                return;
            } else if (fileCancel && file.remote.is_uploading_active) {
                FileStore.cancelUploadFile(file.id, media);
                return;
            } else {
                download(file, media, () => FileStore.updateVoiceNoteBlob(chatId, messageId, file.id));
            }

            TdLibController.clientUpdate({
                '@type': 'clientUpdateMediaActive',
                source: {
                    '@type': 'instantViewSource',
                    instantView,
                    block
                }
            });
            break;
        }
    }
}

export function getPageBlock(block, iv, key = undefined, ref = null) {
    if (!block) return null;

    let element = null;
    switch (block['@type']) {
        case 'pageBlockAnchor': {
            element = <Anchor name={block.name} />;
            break;
        }
        case 'pageBlockAnimation': {
            element = (
                <Animation
                    block={block}
                    caption={block.caption}
                    animation={block.animation}
                    needAutoplay={block.need_autoplay}
                    openMedia={() => openInstantViewMedia(block.animation, block.caption, block, iv, true)}
                />
            );
            break;
        }
        case 'pageBlockAudio': {
            element = (
                <Audio
                    block={block}
                    caption={block.caption}
                    audio={block.audio}
                    openMedia={() => openInstantViewMedia(block.audio, block.caption, block, iv, true)}
                />
            );
            break;
        }
        case 'pageBlockAuthorDate': {
            element = <AuthorDate author={block.author} publishDate={block.publish_date} />;
            break;
        }
        case 'pageBlockBlockQuote': {
            element = <BlockQuote credit={block.credit} text={block.text} />;
            break;
        }
        case 'pageBlockCollage': {
            element = <Collage pageBlocks={block.page_blocks} caption={block.caption} />;
            break;
        }
        case 'pageBlockChatLink': {
            element = <ChatLink title={block.title} photo={block.photo} username={block.username} />;
            break;
        }
        case 'pageBlockCover': {
            element = <Cover cover={block.cover} />;
            break;
        }
        case 'pageBlockDetails': {
            element = <Details header={block.header} pageBlocks={block.page_blocks} isOpen={block.is_open} />;
            break;
        }
        case 'pageBlockDivider': {
            element = <Divider />;
            break;
        }
        case 'pageBlockEmbedded': {
            element = (
                <Embedded
                    url={block.url}
                    html={block.html}
                    posterPhoto={block.poster_photo}
                    width={block.width}
                    height={block.height}
                    caption={block.caption}
                    isFullWidth={block.is_full_width}
                    allowScrolling={block.allow_scrolling}
                />
            );
            break;
        }
        case 'pageBlockEmbeddedPost': {
            element = (
                <EmbeddedPost
                    url={block.url}
                    author={block.author}
                    authorPhoto={block.author_photo}
                    date={block.date}
                    pageBlocks={block.page_blocks}
                    caption={block.caption}
                />
            );
            break;
        }
        case 'pageBlockFooter': {
            element = <Footer footer={block.footer} />;
            break;
        }
        case 'pageBlockHeader': {
            element = <Header header={block.header} />;
            break;
        }
        case 'pageBlockKicker': {
            element = <Kicker kicker={block.kicker} />;
            break;
        }
        case 'pageBlockList': {
            element = <List items={block.items} />;
            break;
        }
        case 'pageBlockListItem': {
            element = <ListItem label={block.label} pageBlocks={block.page_blocks} />;
            break;
        }
        case 'pageBlockMap': {
            element = (
                <Map
                    location={block.location}
                    zoom={block.zoom}
                    width={block.width}
                    height={block.height}
                    caption={block.caption}
                />
            );
            break;
        }
        case 'pageBlockParagraph': {
            element = <Paragraph text={block.text} />;
            break;
        }
        case 'pageBlockPhoto': {
            element = (
                <Photo
                    caption={block.caption}
                    photo={block.photo}
                    url={block.url}
                    openMedia={() => openInstantViewMedia(block.photo, block.caption, block, iv, true)}
                />
            );
            break;
        }
        case 'pageBlockPreformatted': {
            element = <Preformatted text={block.text} language={block.language} />;
            break;
        }
        case 'pageBlockPullQuote': {
            element = <PullQuote credit={block.credit} text={block.text} />;
            break;
        }
        case 'pageBlockRelatedArticle': {
            element = (
                <RelatedArticle
                    url={block.url}
                    title={block.title}
                    description={block.description}
                    photo={block.photo}
                    author={block.author}
                    publishDate={block.publish_date}
                />
            );
            break;
        }
        case 'pageBlockRelatedArticles': {
            element = <RelatedArticles header={block.header} articles={block.articles} />;
            break;
        }
        case 'pageBlockSlideshow': {
            element = <Slideshow pageBlocks={block.page_blocks} caption={block.caption} />;
            break;
        }
        case 'pageBlockSubheader': {
            element = <Subheader subheader={block.subheader} />;
            break;
        }
        case 'pageBlockSubtitle': {
            element = <Subtitle subtitle={block.subtitle} />;
            break;
        }
        case 'pageBlockTable': {
            element = (
                <Table
                    caption={block.caption}
                    cells={block.cells}
                    isBordered={block.is_bordered}
                    isStriped={block.is_striped}
                />
            );
            break;
        }
        case 'pageBlockTableCell': {
            element = (
                <TableCell
                    text={block.text}
                    isHeader={block.is_header}
                    colspan={block.colspan}
                    rowspan={block.rowspan}
                    align={block.align}
                    valign={block.valign}
                />
            );
            break;
        }
        case 'pageBlockTitle': {
            element = <Title title={block.title} />;
            break;
        }
        case 'pageBlockVideo': {
            element = (
                <Video
                    block={block}
                    caption={block.caption}
                    video={block.video}
                    needAutoplay={block.need_autoplay}
                    isLooped={block.is_looped}
                    openMedia={() => openInstantViewMedia(block.video, block.caption, block, iv, true)}
                />
            );
            break;
        }
        case 'pageBlockVoiceNote': {
            element = (
                <VoiceNote
                    block={block}
                    caption={block.caption}
                    voiceNote={block.voice_note}
                    openMedia={() => openInstantViewMedia(block.voice_note, block.caption, block, iv, true)}
                />
            );
            break;
        }
        default: {
            element = <div>{`[${block['@type']}]`}</div>;
            break;
        }
    }

    return <ErrorHandler key={key} ref={ref}>{element}</ErrorHandler>;
}

export function getRichText(richText) {
    if (!richText) {
        return null;
    }

    if (richText instanceof String) {
        return richText;
    }

    switch (richText['@type']) {
        case 'richTextAnchor': {
            const { name, text } = richText;

            return <TextAnchor text={text} name={name} />;
        }
        case 'richTextBold': {
            const { text } = richText;

            return <Bold text={text} />;
        }
        case 'richTextEmailAddress': {
            const { email_address, text } = richText;

            return <EmailAddress emailAddress={email_address} text={text} />;
        }
        case 'richTextFixed': {
            const { text } = richText;

            return <Fixed text={text} />;
        }
        case 'richTextIcon': {
            const { document, height, width } = richText;

            return <Icon document={document} height={height} width={width} />;
        }
        case 'richTextItalic': {
            const { text } = richText;

            return <Italic text={text} />;
        }
        case 'richTextMarked': {
            const { text } = richText;

            return <Marked text={text} />;
        }
        case 'richTextPhoneNumber': {
            const { phone_number, text } = richText;

            return <PhoneNumber phoneNumber={phone_number} text={text} />;
        }
        case 'richTextPlain': {
            const { text } = richText;

            return <Plain text={text} />;
        }
        case 'richTextStrikethrough': {
            const { text } = richText;

            return <Strikethrough text={text} />;
        }
        case 'richTextSubscript': {
            const { text } = richText;

            return <Subscript text={text} />;
        }
        case 'richTextSuperscript': {
            const { text } = richText;

            return <Superscript text={text} />;
        }
        case 'richTexts': {
            const { texts } = richText;

            return <Texts texts={texts} />;
        }
        case 'richTextUnderline': {
            const { text } = richText;

            return <Underline text={text} />;
        }
        case 'richTextUrl': {
            const { text, url } = richText;

            return <Url text={text} url={url} />;
        }
    }

    return `[${richText['@type']}]`;
}

export function isEmptyText(richText) {
    if (!richText) return true;

    switch (richText['@type']) {
        case 'richTextAnchor': {
            const { text } = richText;

            return isEmptyText(text);
        }
        case 'richTextBold': {
            const { text } = richText;

            return isEmptyText(text);
        }
        case 'richTextEmailAddress': {
            const { text } = richText;

            return isEmptyText(text);
        }
        case 'richTextFixed': {
            const { text } = richText;

            return isEmptyText(text);
        }
        case 'richTextIcon': {
            return false;
        }
        case 'richTextItalic': {
            const { text } = richText;

            return isEmptyText(text);
        }
        case 'richTextMarked': {
            const { text } = richText;

            return isEmptyText(text);
        }
        case 'richTextPhoneNumber': {
            const { text } = richText;

            return isEmptyText(text);
        }
        case 'richTextPlain': {
            const { text } = richText;

            return isEmptyText(text);
        }
        case 'richTextStrikethrough': {
            const { text } = richText;

            return isEmptyText(text);
        }
        case 'richTextSubscript': {
            const { text } = richText;

            return isEmptyText(text);
        }
        case 'richTextSuperscript': {
            const { text } = richText;

            return isEmptyText(text);
        }
        case 'richTexts': {
            const { texts } = richText;

            return texts.every(isEmptyText);
        }
        case 'richTextUnderline': {
            const { text } = richText;

            return isEmptyText(text);
        }
        case 'richTextUrl': {
            const { text } = richText;

            return isEmptyText(text);
        }
    }

    return false;
}

export function getHorizontalAlignment(align) {
    if (!align) return null;

    switch (align['@type']) {
        case 'pageBlockHorizontalAlignmentCenter': {
            return 'center';
        }
        case 'pageBlockHorizontalAlignmentLeft': {
            return 'left';
        }
        case 'pageBlockHorizontalAlignmentRight': {
            return 'right';
        }
    }

    return null;
}

export function getVerticalAlignment(valign) {
    if (!valign) return null;

    switch (valign['@type']) {
        case 'pageBlockVerticalAlignmentBottom': {
            return 'bottom';
        }
        case 'pageBlockVerticalAlignmentMiddle': {
            return 'middle';
        }
        case 'pageBlockVerticalAlignmentTop': {
            return 'top';
        }
    }

    return null;
}

export function getInnerBlocks(block) {
    if (!block) return [];

    switch (block['@type']) {
        case 'pageBlockAnchor': {
            return [];
        }
        case 'pageBlockAnimation': {
            return [block.caption];
        }
        case 'pageBlockAudio': {
            return [block.caption];
        }
        case 'pageBlockAuthorDate': {
            return [];
        }
        case 'pageBlockBlockQuote': {
            return [];
        }
        case 'pageBlockChatLink': {
            return [];
        }
        case 'pageBlockCollage': {
            const innerBlocks = block.page_blocks.map(x => [x, ...getInnerBlocks(x)]);

            return [].concat.apply([], innerBlocks);
        }
        case 'pageBlockCover': {
            return [block.cover];
        }
        case 'pageBlockDetails': {
            const innerBlocks = block.page_blocks.map(x => [x, ...getInnerBlocks(x)]);

            return [].concat.apply([], innerBlocks);
        }
        case 'pageBlockDivider': {
            return [];
        }
        case 'pageBlockEmbedded': {
            return [block.caption];
        }
        case 'pageBlockEmbeddedPost': {
            const innerBlocks = block.page_blocks.map(x => [x, ...getInnerBlocks(x)]);

            return [].concat.apply([block.caption], innerBlocks);
        }
        case 'pageBlockFooter': {
            return [];
        }
        case 'pageBlockHeader': {
            return [];
        }
        case 'pageBlockKicker': {
            return [];
        }
        case 'pageBlockList': {
            const innerBlocks = block.items.map(x => [x, ...getInnerBlocks(x)]);

            return [].concat.apply([], innerBlocks);
        }
        case 'pageBlockListItem': {
            const innerBlocks = block.page_blocks.map(x => [x, ...getInnerBlocks(x)]);

            return [].concat.apply([], innerBlocks);
        }
        case 'pageBlockMap': {
            return [block.caption];
        }
        case 'pageBlockParagraph': {
            return [];
        }
        case 'pageBlockPhoto': {
            return [block.caption];
        }
        case 'pageBlockPreformatted': {
            return [];
        }
        case 'pageBlockPullQuote': {
            return [];
        }
        case 'pageBlockRelatedArticle': {
            return [];
        }
        case 'pageBlockRelatedArticles': {
            return [...block.articles];
        }
        case 'pageBlockSlideshow': {
            const innerBlocks = block.page_blocks.map(x => [x, ...getInnerBlocks(x)]);

            return [].concat.apply([block.caption], innerBlocks);
        }
        case 'pageBlockSubheader': {
            return [];
        }
        case 'pageBlockSubtitle': {
            return [];
        }
        case 'pageBlockTable': {
            return [...block.cells];
        }
        case 'pageBlockTableCell': {
            return [];
        }
        case 'pageBlockTitle': {
            return [];
        }
        case 'pageBlockVideo': {
            return [block.caption];
        }
    }

    return [];
}

export function getBlockMedia(block) {
    if (!block) return null;

    switch (block['@type']) {
        case 'pageBlockAnimation': {
            return block.animation;
        }
        case 'pageBlockPhoto': {
            return block.photo;
        }
        case 'pageBlockVideo': {
            return block.video;
        }
    }

    return null;
}

export function getBlockCaption(block) {
    if (!block) return null;

    switch (block['@type']) {
        case 'pageBlockAnimation': {
            return block.caption;
        }
        case 'pageBlockPhoto': {
            return block.caption;
        }
        case 'pageBlockVideo': {
            return block.caption;
        }
    }

    return null;
}

export function getBlockUrl(block) {
    if (!block) return null;

    switch (block['@type']) {
        case 'pageBlockPhoto': {
            return block.url;
        }
    }

    return null;
}

export function isValidMediaBlock(block) {
    if (!block) return false;

    switch (block['@type']) {
        case 'pageBlockAnimation': {
            return true;
        }
        case 'pageBlockPhoto': {
            return true;
        }
        case 'pageBlockVideo': {
            return true;
        }
    }

    return false;
}

export function isValidAudioBlock(block) {
    if (!block) return false;

    return block['@type'] === 'pageBlockAudio';
}

export function isValidVoiceNoteBlock(block) {
    if (!block) return false;

    return block['@type'] === 'pageBlockVoiceNote';
}

export function getValidBlocks(iv, func) {
    if (!iv) return [];

    const { page_blocks } = iv;

    const blocks = [];
    page_blocks.forEach(x => {
        blocks.push(x);
        const innerBlocks = getInnerBlocks(x);
        innerBlocks.forEach(i => {
            blocks.push(i);
        });
    });

    return blocks.filter(func);
}

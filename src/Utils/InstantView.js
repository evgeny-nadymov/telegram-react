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
import Divider from '../Components/InstantView/Blocks/Divider';
import Footer from '../Components/InstantView/Blocks/Footer';
import Header from '../Components/InstantView/Blocks/Header';
import List from '../Components/InstantView/Blocks/List';
import ListItem from '../Components/InstantView/Blocks/ListItem';
import Paragraph from '../Components/InstantView/Blocks/Paragraph';
import Photo from '../Components/InstantView/Blocks/Photo';
import Preformatted from '../Components/InstantView/Blocks/Preformatted';
import PullQuote from '../Components/InstantView/Blocks/PullQuote';
import Subheader from '../Components/InstantView/Blocks/Subheader';
import Subtitle from '../Components/InstantView/Blocks/Subtitle';
import Title from '../Components/InstantView/Blocks/Title';
import Bold from '../Components/InstantView/RichText/Bold';
import EmailAddress from '../Components/InstantView/RichText/EmailAddress';
import Fixed from '../Components/InstantView/RichText/Fixed';
import Icon from '../Components/InstantView/RichText/Icon';
import Italic from '../Components/InstantView/RichText/Italic';
import Marked from '../Components/InstantView/RichText/Marked';
import Plain from '../Components/InstantView/RichText/Plain';
import Strikethrough from '../Components/InstantView/RichText/Strikethrough';
import Subscript from '../Components/InstantView/RichText/Subscript';
import Superscript from '../Components/InstantView/RichText/Superscript';
import Texts from '../Components/InstantView/RichText/Texts';
import Underline from '../Components/InstantView/RichText/Underline';
import Url from '../Components/InstantView/RichText/Url';

export function getPageBlock(block) {
    if (!block) return null;

    switch (block['@type']) {
        case 'pageBlockAnchor': {
            return <Anchor name={block.name} />;
        }
        case 'pageBlockAnimation': {
            return (
                <Animation caption={block.caption} animation={block.animation} need_autoplay={block.need_autoplay} />
            );
        }
        case 'pageBlockAuthorDate': {
            return <AuthorDate author={block.author} publishDate={block.publish_date} />;
        }
        case 'pageBlockBlockQuote': {
            return <BlockQuote credit={block.credit} text={block.text} />;
        }
        case 'pageBlockDivider': {
            return <Divider />;
        }
        case 'pageBlockFooter': {
            return <Footer footer={block.footer} />;
        }
        case 'pageBlockHeader': {
            return <Header header={block.header} />;
        }
        case 'pageBlockList': {
            return <List items={block.items} />;
        }
        case 'pageBlockListItem': {
            return <ListItem label={block.label} page_blocks={block.page_blocks} />;
        }
        case 'pageBlockParagraph': {
            return <Paragraph text={block.text} />;
        }
        case 'pageBlockPhoto': {
            return <Photo caption={block.caption} photo={block.photo} url={block.url} />;
        }
        case 'pageBlockPreformatted': {
            return <Preformatted text={block.text} language={block.language} />;
        }
        case 'pageBlockPullQuote': {
            return <PullQuote credit={block.credit} text={block.text} />;
        }
        case 'pageBlockSubheader': {
            return <Subheader subheader={block.subheader} />;
        }
        case 'pageBlockSubtitle': {
            return <Subtitle subtitle={block.subtitle} />;
        }
        case 'pageBlockTitle': {
            return <Title title={block.title} />;
        }
    }

    return <div>{`[${block['@type']}]`}</div>;
}

export function getRichText(richText) {
    switch (richText['@type']) {
        case 'richTextAnchor': {
            const { name, text } = richText;

            return <Anchor text={text} name={name} />;
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

    return null;
}

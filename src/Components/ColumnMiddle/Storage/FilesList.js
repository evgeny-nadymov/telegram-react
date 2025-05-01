/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import { download, loadChatsContent, loadDraftContent, loadMessageContents } from '../../../Utils/File';
import { canSendMediaMessages, getChatFullInfo, getChatMedia, getSupergroupId, isChannelChat } from '../../../Utils/Chat';
import MessageStore from '../../../Stores/MessageStore';
import ChatInfoDialog from '../../Popup/ChatInfoDialog';
import Footer from '../Footer';
import Header from './Header';
import HeaderPlayer from '../../Player/HeaderPlayer';
import MessagesList from './MessagesList';
import StickerSetDialog from '../../Popup/StickerSetDialog';
import { getSrc } from '../../../Utils/File';
import AppStore from '../../../Stores/ApplicationStore';
import ChatStore from '../../../Stores/ChatStore';
import FileStore from '../../../Stores/FileStore';
import '../DialogDetails.css';
import TdLibController from '../../../Controllers/TdLibController';
import Folder from '../../Message/Storage/icons/folder';
import '../../Message/Message.css';


class DialogDetails extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            chatId: AppStore.getChatId(),
            messageId: AppStore.getMessageId(),
            selectedCount: 0,
            wallpaper: null,
            wallpaperSrc: null,
            
            mounted: this.props.storage.mounted,
            path: this.props.storage.path,
            json: this.props.storage.json
        };
        
        this.getPath = this.getPath.bind(this);
        this.setPath = this.setPath.bind(this);
        this.loadFolders = this.loadFolders.bind(this);
        this.openFolder = this.openFolder.bind(this);
        this.goBackPath = this.goBackPath.bind(this);
        this.getStorageChannelId = this.getStorageChannelId.bind(this);
        this.loadJSONFile = this.loadJSONFile.bind(this);

        this.updateFileStructure = this.updateFileStructure.bind(this);
        this.addFolder = this.addFolder.bind(this);


        // this.getStorageChannelId();
        // console.warn(this.state);
    }

    // shouldComponentUpdate(nextProps, nextState) {
    //     // const { chatId, messageId, selectedCount, wallpaper } = this.state;
    //     // if (nextState.chatId !== chatId) {
    //     //     return true;
    //     // }
    //     // if (nextState.messageId !== messageId) {
    //     //     return true;
    //     // }
    //     // if (nextState.selectedCount !== selectedCount) {
    //     //     return true;
    //     // }
    //     // if (nextState.wallpaper !== wallpaper) {
    //     //     return true;
    //     // }

    //     // return false;
    //     return true;
    // }
    UNSAFE_componentWillMount() {

    }
    componentDidMount() {
        // AppStore.on('clientUpdateChatDetailsVisibility', this.onClientUpdateChatDetailsVisibility);
        // AppStore.on('clientUpdateChatId', this.onClientUpdateChatId);
        // ChatStore.on('clientUpdateChatBackground', this.onClientUpdateChatBackground);
        // FileStore.on('clientUpdateDocumentBlob', this.onClientUpdateDocumentBlob);
        // FileStore.on('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);
        this.getStorageChannelId();
        console.log("Mounted");
    }
    
    componentWillUnmount() {
        // AppStore.off('clientUpdateChatDetailsVisibility', this.onClientUpdateChatDetailsVisibility);
        // AppStore.off('clientUpdateChatId', this.onClientUpdateChatId);
        // ChatStore.off('clientUpdateChatBackground', this.onClientUpdateChatBackground);
        // FileStore.off('clientUpdateDocumentBlob', this.onClientUpdateDocumentBlob);
        // FileStore.off('clientUpdateDocumentThumbnailBlob', this.onClientUpdateDocumentThumbnailBlob);

        this.props.storage.storageUpdate({
            path: this.state.path,
            json: this.state.json
        });
    }

    scrollToStart() {}

    // onClientUpdateChatId = update => {
    //     this.setState({
    //         chatId: update.nextChatId,
    //         messageId: update.nextMessageId
    //     });
    //     // console.warn(update);
    // };

    getPath() {
        return this.state.path;
    }

    setPath(path) {
        this.setState({
            path: path
        });
    }

    loadFolders(path) {
        var folders = [];
        var files = [];
        var json = this.state.json;

        path = eval(path);
        console.log("Path", path)

        for (let key in path) {
            // console.log(key, "->", path[key]);
            if (path[key]['@type'] == "folder") {
                folders.push(
                    <Folder 
                        folder_name={key}
                        openFolder={this.openFolder}
                    ></Folder>
                );
            }
            else {
                files.push(
                    <Folder 
                        folder_name={key}
                        openFolder={this.openFolder}
                    ></Folder>
                );
            }
        }
        // console.warn(folders);
        
        this.setState({
            folders: folders,
            files: files
        });
    }

    openFolder(folder) {
        let format = '[\"'+folder+'\"]["@structure"]';
        let newPath = this.state.path + format;

        this.setState({ path: newPath });

        this.loadFolders(newPath);
    }

    goBackPath() {
        
        let current = this.state.path;
        var pos = current.lastIndexOf('[', current.lastIndexOf('[')-1);
        var newPath = current.substring(0, pos);

        if (newPath == '') return;

        this.setPath(newPath);

        this.loadFolders(newPath);
    }

    getStorageChannelId = async () => {
        // Search Storage
        const search_storage = [];
        search_storage.push(TdLibController.send({
            '@type': 'searchChats',
            query: "Storage."+this.props.getCurrentUserId(),
            limit: 1
        }));
        const storage_channel_id_array = await Promise.all(search_storage.map(x => x.catch(e => null)));
        const storage_channel_id = storage_channel_id_array[0].chat_ids[0];

        TdLibController.clientUpdate({
            '@type': 'clientUpdateOpenChat',
            chatId: storage_channel_id,
            messageId: null,
            popup: false
        });
        this.setState({ chatId: storage_channel_id });
        
        // if (!this.state.mounted) this.loadJSONFile();
        // else this.loadFolders(this.state.path);
        this.loadJSONFile();
    }

    async getFileStructureJSON() {
        const { chatId } = this.state;
        var fs = null;
        
        var res = await TdLibController.send({
            '@type': 'searchChatMessages',
            chat_id: chatId,
            query: '',
            sender_user_id: 0,
            from_message_id: 0,
            offset: 0,
            limit: 10000000,
            filter: { '@type': 'searchMessagesFilterDocument' }
        }).then((data)=> {
            // console.warn("searchMessagesFilterDocument", data);
            var n = data.messages.length;
            for (var i=0; i<n; i++) {
                console.log(data.messages[i]);
                if (data.messages[i].content.document.file_name == "FileStructure.json") {
                    fs = data.messages[i];
                    return fs;
                }
            }
        });
        console.log("getFileStructureJSON", res);
        return res;
    }

    async loadJSONFile() {
        const { chatId, messageId } = this.state;

        var fs = await this.getFileStructureJSON();
        
        var file = fs.content.document.document;
        var filename = fs.content.document.file_name;

        FileStore.getLocalFile(FileStore.getStore(), file, null, () => {
            var blob = FileStore.getBlob(file.id);
            console.warn('File Found', file)
            if (blob) {
                if (typeof window.navigator.msSaveBlob !== 'undefined') {
                    window.navigator.msSaveBlob(blob, filename);
                } else {
                    let blobURL = window.URL.createObjectURL(blob);
                    
                    if (filename == "FileStructure.json"){
                        fetch(blobURL).then((resp)=>{ 
                            return resp.text() }).then((text)=>{
                                var json = JSON.parse(text);

                                this.setState({json: json, fileStructureFileId: fs.id});

                                if (json.type == "FileStructure") {
                                    this.loadFolders(this.state.path);
                                }
                            }
                        );
                    }
                    
                    window.URL.revokeObjectURL(blobURL);
                }
            }
        });
    }

    async updateFileStructure(json) {
        var file = new File([JSON.stringify(json)], "FileStructure.json", {type: "application/json", lastModified: new Date().getTime()})
        var content = {
            '@type': 'inputMessageDocument',
            document: { '@type': 'inputFileBlob', name: file.name, data: file },
            thumbnail: null,
            caption: {
                "@type": "formattedText",
                "entities": [],
                "text": ""
            }
        };
        
        // console.log("NewItem:", newItem);
        const { chatId } = this.state;

        const uploadRes = await TdLibController.send({
            '@type': 'sendMessage',
            chat_id: chatId,
            reply_to_message_id: 0,
            input_message_content: content
        });
        console.log("Result", uploadRes);

        var prevFileId = this.state.fileStructureFileId;
        console.log("prevFileId", prevFileId);

        // Delete Previous File
        const delRes = await TdLibController.send({
            '@type': 'deleteMessages',
            chat_id: chatId,
            message_ids: [prevFileId],
            revoke: true
        });

        // this.setState({
        //     fileStructureFileId: uploadRes.id
        // });

        this.state.fileStructureFileId = uploadRes.id;
        
    }

    async addFolder() {
        console.log("newFolder");
        this.updateFileStructure(this.state.json);
    }

    render() {
        // console.warn("Rendering...");

        // // this.getStorageChannelId();
        

        // const { chatId, messageId, wallpaper } = this.state;

        // let style = null;
        // let src = null;
        // if (wallpaper) {
        //     const { document } = wallpaper;
        //     if (document) {
        //         const { thumbnail, document: file } = document;
        //         if (file) {
        //             src = getSrc(file);
        //         }

        //         if (!src && thumbnail) {
        //             src = getSrc(thumbnail.file);
        //         }
        //     }

        //     style = {
        //         backgroundImage: src ? `url(${src})` : null
        //     }
        // }

        // console.log('[p] dialogDetails.render');
        // console.log("1)\nchatId", chatId, "\nmessageId", messageId);

        return (
            <div className="storage">
                {/* <HeaderPlayer /> */}
                <Header
                    // ref={this.headerRef}
                    addFolder={this.addFolder}
                    goBackPath={this.goBackPath}
                />
                {/* <MessagesList 
                    ref={ref => (this.messagesList = ref)} 
                    chatId={chatId} messageId={messageId}

                    getPath={this.getPath}
                    setPath={this.setPath}
                /> */}
                <div className='storage-container'>
                    {this.state.folders}
                    {this.state.files}
                </div>

                {/* <Footer chatId={chatId} /> */}
                {/* <StickerSetDialog /> */}
                {/* <ChatInfoDialog /> */}
                {/*<Footer />*/}
            </div>
        );
    }
}

export default DialogDetails;

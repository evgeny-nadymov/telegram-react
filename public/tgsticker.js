/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

window.RLottie = (function () {
    let rlottie = {}, apiInitStarted = false, apiInited = false, initCallbacks = [];
    let deviceRatio = window.devicePixelRatio || 1;
    let rlottieWorkers = [], curWorkerNum = 0;

    let startTime = +(new Date());
    function dT() {
        return '[' + ((+(new Date()) - startTime)/ 1000.0) + '] ';
    }

    rlottie.Api = {};
    rlottie.players = Object.create(null);
    rlottie.events = Object.create(null);
    rlottie.frames = new Map();
    rlottie.WORKERS_LIMIT = 4;

    let segmentId = 0;
    let reqId = 0;
    let mainLoopTO = false;
    let checkViewportDate = false;
    let lastRenderDate = false;

    let { userAgent } = window.navigator;
    let isSafari = !!window.safari ||
        !!(userAgent && (/\b(iPad|iPhone|iPod)\b/.test(userAgent) || (!!userAgent.match('Safari') && !userAgent.match('Chrome'))));
    let isRAF = isSafari;
    rlottie.isSafari = isSafari;

    function wasmIsSupported() {
        try {
            if (typeof WebAssembly === 'object' &&
                typeof WebAssembly.instantiate === 'function') {
                const module = new WebAssembly.Module(Uint8Array.of(
                    0x0, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00
                ));
                if (module instanceof WebAssembly.Module) {
                    return new WebAssembly.Instance(module) instanceof WebAssembly.Instance;
                }
            }
        } catch (e) {}
        return false;
    }

    function isSupported() {
        return (
            wasmIsSupported() &&
            typeof Uint8ClampedArray !== 'undefined' &&
            typeof Worker !== 'undefined' &&
            typeof ImageData !== 'undefined'
        );
    }

    rlottie.isSupported = isSupported();

    function mainLoop() {
        let delta, rendered;
        const now = +Date.now();
        const checkViewport = !checkViewportDate || (now - checkViewportDate) > 1000;

        for (let reqId in rlottie.players) {
            const rlPlayer = rlottie.players[reqId];
            if (rlPlayer && rlPlayer.frameCount) {
                delta = now - rlPlayer.frameThen;
                if (delta > rlPlayer.frameInterval) {
                    rendered = render(rlPlayer, checkViewport, true);
                    if (rendered) {
                        lastRenderDate = now;
                    }
                }
            }
        }

        const delay = now - lastRenderDate < 100 ? 16 : 500;
        if (delay < 20 && isRAF) {
            mainLoopTO = requestAnimationFrame(mainLoop)
        } else {
            mainLoopTO = setTimeout(mainLoop, delay);
        }
        if (checkViewport) {
            checkViewportDate = now;
        }
    }

    function setupMainLoop() {
        let isEmpty = true;
        for (const key in rlottie.players) {
            const rlPlayer = rlottie.players[key];
            if (rlPlayer && rlPlayer.frameCount) {
                isEmpty = false;
                break;
            }
        }

        if ((mainLoopTO !== false) === isEmpty) {
            if (isEmpty) {
                if (isRAF) {
                    cancelAnimationFrame(mainLoopTO);
                }
                try {
                    clearTimeout(mainLoopTO);
                } catch (e) {};
                mainLoopTO = false;
            } else {
                if (isRAF) {
                    mainLoopTO = requestAnimationFrame(mainLoop);
                } else {
                    mainLoopTO = setTimeout(mainLoop, 0);
                }
            }
        }
    }

    function initApi(callback) {
        if (apiInited) {
            callback && callback();
        } else {
            callback && initCallbacks.push(callback);
            if (!apiInitStarted) {
                apiInitStarted = true;
                let workersRemain = rlottie.WORKERS_LIMIT;
                for (let workerNum = 0; workerNum < rlottie.WORKERS_LIMIT; workerNum++) {
                    (function(workerNum) {
                        const rlottieWorker = rlottieWorkers[workerNum] = new QueryableWorker('rlottie/rlottie-wasm.worker.js');
                        rlottieWorker.addListener('ready', function () {
                            console.log(dT(), 'worker #' + workerNum + ' ready');
                            rlottieWorker.addListener('frame', onFrame);
                            rlottieWorker.addListener('loaded', onLoaded);
                            --workersRemain;
                            if (!workersRemain) {
                                console.log(dT(), 'workers ready');
                                apiInited = true;
                                for (let i = 0; i < initCallbacks.length; i++) {
                                    initCallbacks[i]();
                                }
                                initCallbacks = [];
                            }
                        });
                    })(workerNum);
                }
            }
        }
    }

    function initPlayer(el, options) {
        options = options || {};
        const rlPlayer = {};
        let fileId = null;
        if (options.fileId && (options.animationData || options.stringData)) {
            fileId = options.fileId;
        }

        options.maxDeviceRatio = 1.5;

        if (!fileId) {
            console.warn('fileId not found');
            return;
        }
        let pic_width = options.width;
        let pic_height = options.height;
        if (!pic_width || !pic_height) {
            pic_width = pic_height = 256;
        }
        rlPlayer.autoplay = options.autoplay || false;
        rlPlayer.paused = !rlPlayer.autoplay;
        rlPlayer.loop = options.loop || false;
        rlPlayer.playWithoutFocus = options.playWithoutFocus;
        rlPlayer.inViewportFunc = options.inViewportFunc;
        rlPlayer.queueLength = options.queueLength;

        const curDeviceRatio = options.maxDeviceRatio ? Math.min(options.maxDeviceRatio, deviceRatio) : deviceRatio;

        rlPlayer.fileId = fileId;
        rlPlayer.reqId = ++reqId;
        rlPlayer.el = el;
        rlPlayer.width = Math.trunc(pic_width * curDeviceRatio);
        rlPlayer.height = Math.trunc(pic_height * curDeviceRatio);
        rlPlayer.imageData = new ImageData(rlPlayer.width, rlPlayer.height);
        rlottie.players[reqId] = rlPlayer;

        rlPlayer.canvas = document.createElement('canvas');
        rlPlayer.canvas.width = pic_width * curDeviceRatio;
        rlPlayer.canvas.height = pic_height * curDeviceRatio;
        rlPlayer.el.innerHTML = null;
        rlPlayer.el.appendChild(rlPlayer.canvas);
        rlPlayer.context = rlPlayer.canvas.getContext('2d');
        rlPlayer.forceRender = true;

        const rWorker = rlottieWorkers[curWorkerNum++];
        if (curWorkerNum >= rlottieWorkers.length) {
            curWorkerNum = 0;
        }
        rlPlayer.nextFrameNo = false;
        rlPlayer.rWorker = rWorker;
        rlPlayer.clamped = new Uint8ClampedArray(rlPlayer.width * rlPlayer.height * 4);

        const dataKey = getDataKey(reqId);
        const data = rlottie.frames.get(dataKey);
        if (data) {
            const frameData = data.frames[0];

            if (frameData) {
                doRender(rlPlayer, frameData.frame, 0);
            }
        } else {
            rlottie.frames.set(dataKey, {
                frames: {},
                cachingModulo: options.cachingModulo || 3,
                fileId: rlPlayer.fileId,
                width: rlPlayer.width,
                height: rlPlayer.height
            });
        }

        if (options.stringData) {
            rWorker.sendQuery('loadFromJson', rlPlayer.reqId, options.stringData, rlPlayer.width, rlPlayer.height);
        } else if (options.animationData) {
            rWorker.sendQuery('loadFromBlob', rlPlayer.reqId, options.animationData, rlPlayer.width, rlPlayer.height);
        } else {
            rWorker.sendQuery('loadFromData', rlPlayer.reqId, fileId, rlPlayer.width, rlPlayer.height);
        }

        return rlPlayer.reqId;
    }

    function destroyWorkers() {
        for (let workerNum = 0; workerNum < rlottie.WORKERS_LIMIT; workerNum++) {
            if (rlottieWorkers[workerNum]) {
                rlottieWorkers[workerNum].terminate();
                console.log('worker #' + workerNum + ' terminated');
            }
        }
        console.log('workers destroyed');
        apiInitStarted = apiInited = false;
        rlottieWorkers = [];
    }

    function getDataKey(reqId) {
        const rlPlayer = rlottie.players[reqId];
        if (!rlPlayer) {
            return null;
        }

        const { fileId, width, height } = rlPlayer;

        return `${fileId}_${width}_${height}`;
    }

    function render(rlPlayer, checkViewport) {
        let renderPlayer = true;
        if (!rlPlayer.canvas || rlPlayer.canvas.width == 0 || rlPlayer.canvas.height == 0) {
            renderPlayer = false;
        }

        if (!rlPlayer.forceRender) {
            // not focused
            if (!rlPlayer.playWithoutFocus && !document.hasFocus() || !rlPlayer.frameCount) {
                renderPlayer = false;
            }

            // paused
            if (rlPlayer.paused) {
                renderPlayer = false;
            }

            // not in viewport
            let { isInViewport, inViewportFunc } = rlPlayer;
            if (isInViewport === undefined || checkViewport) {
                const rect = rlPlayer.el.getBoundingClientRect();
                if (inViewportFunc) {
                    isInViewport = inViewportFunc(rlPlayer.fileId, rect);
                } else {
                    if (rect.bottom < 0 ||
                        rect.right < 0 ||
                        rect.top > (window.innerHeight || document.documentElement.clientHeight) ||
                        rect.left > (window.innerWidth || document.documentElement.clientWidth)) {
                        isInViewport = false;
                    } else {
                        isInViewport = true;
                    }
                }
                rlPlayer.isInViewport = isInViewport;
            }
            if (!isInViewport) {
                renderPlayer = false;
            }
        }

        if (!renderPlayer) {
            return false;
        }

        const frameData = rlPlayer.frameQueue.shift();
        if (frameData !== null) {
            const { frameNo, frame } = frameData;
            doRender(rlPlayer, frame, frameNo);

            if (rlPlayer.from === undefined && rlPlayer.to === undefined) {
                if (rlPlayer.frameCount - 1 === frameNo) {
                    if (!rlPlayer.loop) {
                        rlPlayer.paused = true;
                    }

                    fireLoopComplete(rlPlayer);
                }
            } else {
                if (frameNo === rlPlayer.to) {
                    rlPlayer.paused = true;
                }
            }

            const now = +(new Date());
            rlPlayer.frameThen = now - (now % rlPlayer.frameInterval);

            const nextFrameNo = rlPlayer.nextFrameNo;
            if (nextFrameNo !== false) {
                rlPlayer.nextFrameNo = false;
                requestFrame(rlPlayer.reqId, nextFrameNo, rlPlayer.segmentId);
            }
        }

        return true;
    }

    function fireFirstFrameEvent(rlPlayer) {
        if (!rlPlayer.firstFrame) {
            rlPlayer.firstFrame = true;
            const rlEvents = rlottie.events[rlPlayer.reqId];
            if (rlEvents) {
                rlEvents['firstFrame'] && rlEvents['firstFrame']();
            }
        }
    }

    function fireLoopComplete(rlPlayer) {
        const rlEvents = rlottie.events[rlPlayer.reqId];
        if (rlEvents) {
            rlEvents['loopComplete'] && rlEvents['loopComplete']();
        }
    }

    function doRender(rlPlayer, frame, frameNo) {
        rlPlayer.frameNo = frameNo;
        rlPlayer.forceRender = false;
        rlPlayer.imageData.data.set(frame);
        rlPlayer.context.putImageData(rlPlayer.imageData, 0, 0);

        fireFirstFrameEvent(rlPlayer);
    }

    function requestFrame(reqId, frameNo, segmentId) {
        const dataKey = getDataKey(reqId);
        const data = rlottie.frames.get(dataKey);
        if (!data) return;
        const rlPlayer = rlottie.players[reqId];

        const frameData = data.frames[frameNo];
        if (frameData) {
            onFrame(reqId, frameNo, frameData.frame, segmentId)
        } else if (isSafari) {
            rlPlayer.rWorker.sendQuery('renderFrame', reqId, frameNo, segmentId);
        } else {
            if(!rlPlayer.clamped.length) { // fix detached
                rlPlayer.clamped = new Uint8ClampedArray(rlPlayer.width * rlPlayer.height * 4);
            }
            rlPlayer.rWorker.sendQuery('renderFrame', reqId, frameNo, segmentId, rlPlayer.clamped);
        }
    }

    function onFrame(reqId, frameNo, frame, segmentId) {
        const dataKey = getDataKey(reqId);
        const data = rlottie.frames.get(dataKey);
        const rlPlayer = rlottie.players[reqId];

        if (!rlPlayer) {
            return;
        }

        if (rlPlayer.segmentId !== segmentId) {
            return;
        }

        if (data.cachingModulo &&
            !data.frames[frameNo] &&
            (!frameNo || ((reqId + frameNo) % data.cachingModulo))) {
            data.frames[frameNo] = {
                // hash: new Uint8ClampedArray(frame).reduce((a, b) => a + b),
                frame: new Uint8ClampedArray(frame),
            };
        }
        if (rlPlayer) {
            rlPlayer.frameQueue.push({ frameNo, frame, segmentId });
        }

        // immediately render first frame
        if (frameNo === 0) {
            for (let key in rlottie.players) {
                const rlPlayer = rlottie.players[key];
                if (rlPlayer && rlPlayer.forceRender) {
                    const dataKey2 = getDataKey(key);
                    if (dataKey === dataKey2) {
                        doRender(rlPlayer, frame, frameNo);
                    }
                }
            }
        }

        let nextFrameNo;
        if (rlPlayer.from !== undefined && rlPlayer.to !== undefined) {
            nextFrameNo = rlPlayer.from > rlPlayer.to ? frameNo - 1 : frameNo + 1;
        } else {
            nextFrameNo = frameNo + 1;
        }

        if (nextFrameNo < 0) {
            nextFrameNo = data.frameCount - 1;
        }
        if (nextFrameNo >= data.frameCount) {
            nextFrameNo = 0;
        }

        if (rlPlayer.frameQueue.needsMore())  {
            requestFrame(reqId, nextFrameNo, segmentId);
        } else {
            rlPlayer.nextFrameNo = nextFrameNo;
        }
    }

    function onLoaded(reqId, frameCount, fps) {
        const dataKey = getDataKey(reqId);
        const data = rlottie.frames.get(dataKey);
        const rlPlayer = rlottie.players[reqId];

        let frameNo = 0;
        if (data) {
            data.fps = fps;
            data.frameCount = frameCount;
        }

        if (rlPlayer) {
            const queueLength = rlPlayer.queueLength || fps / 4;

            rlPlayer.fps = fps;
            rlPlayer.frameCount = frameCount;
            rlPlayer.frameThen = Date.now();
            rlPlayer.frameInterval = 1000 / fps;
            rlPlayer.frameQueue = new FrameQueue(queueLength);
            rlPlayer.nextFrameNo = false;

            setupMainLoop();
            requestFrame(reqId, frameNo, rlPlayer.segmentId);
        }
    }

    rlottie.init = function(el, options) {
        if (!rlottie.isSupported) {
            return false;
        }
        initApi(() => {
            if (el && options) {
                initPlayer(el, options);
            }
        });
    }

    function loadAnimation(options, callback) {
        if (!rlottie.isSupported) {
            return false;
        }

        initApi(() => {
            const reqId = initPlayer(options.container, options);
            callback && callback(reqId);
        });
    }

    function unloadAnimation(reqId) {
        const rlPlayer = rlottie.players[reqId];
        if (!rlPlayer) return;

        let hasOther = false;
        const dataKey = getDataKey(reqId);
        for (let key in rlottie.players) {
            if (getDataKey(key) === dataKey && String(reqId) !== key) {
                hasOther = true;
                break;
            }
        }

        if (!hasOther) {
            const data = rlottie.frames.get(dataKey);
            if (data && data.frames[0]) {
                data.frames = { 0: { frame: data.frames[0].frame } };
            }
        }

        delete rlottie.players[reqId];

        setupMainLoop();
    }

    rlottie.initApi = function () {
        initApi();
    }

    rlottie.destroyWorkers = function() {
        destroyWorkers();
    }

    rlottie.hasFirstFrame = function (reqId) {
        const dataKey = getDataKey(reqId);
        const data = rlottie.frames.get(dataKey);

        return data && Boolean(data.frames[0]);
    }

    rlottie.loadAnimation = function (options, callback) {
        return loadAnimation(options, callback);
    }

    rlottie.destroy = function(reqId) {
        unloadAnimation(reqId);
    }

    rlottie.clear = function() {
        rlottie.frames = new Map();
        return true;
    }

    rlottie.clearPlayers = function() {
        rlottie.players = Object.create(null);
        return true;
    }

    rlottie.addEventListener = function (reqId, eventName, callback) {
        if (!rlottie.events[reqId]) {
            rlottie.events[reqId] = Object.create(null);
        }

        rlottie.events[reqId][eventName] = callback;
    }

    rlottie.removeEventListener = function (reqId, eventName) {
        if (!rlottie.events[reqId]) {
            return;
        }

        delete rlottie.events[reqId][eventName];

        if (!Object.keys(rlottie.events[reqId]).length) {
            delete rlottie.events[reqId];
        }
    }

    rlottie.isPaused = function (reqId) {
        const rlPlayer = rlottie.players[reqId];
        if (!rlPlayer) return false;

        return rlPlayer.paused;
    }

    rlottie.pause = function (reqId) {
        const rlPlayer = rlottie.players[reqId];
        if (!rlPlayer) return;

        rlPlayer.paused = true;
    }

    rlottie.play = function (reqId) {
        const rlPlayer = rlottie.players[reqId];
        if (!rlPlayer) return;

        rlPlayer.paused = false;
    }

    rlottie.playSegments = function (reqId, segments, forceFlag) {
        // console.log('[rlottie] playSegments', segments);
        const rlPlayer = rlottie.players[reqId];
        if (!rlPlayer) return;

        if (!segments || segments.length < 2) return;

        rlPlayer.segmentId = ++segmentId;
        rlPlayer.from = forceFlag ? segments[0] : rlPlayer.frameNo;
        rlPlayer.to = segments[1];
        rlPlayer.paused = false;

        if (rlPlayer.fps) {
            rlPlayer.frameQueue = new FrameQueue(rlPlayer.fps / 4);
            rlPlayer.nextFrameNo = false;

            setupMainLoop();
            requestFrame(rlPlayer.reqId, rlPlayer.from, rlPlayer.segmentId);
        }
    }

    rlottie.preload = function (fileId, stringData) {
        // initPlayer(null, { fileId, stringData });
    }

    return rlottie;
}());

class QueryableWorker {
    constructor(url, defaultListener, onError) {
        this.worker = new Worker(url);
        this.listeners = [];

        this.defaultListener = defaultListener || function() { };
        if (onError) {
            this.worker.onerror = onError;
        }

        this.worker.onmessage = event => {
            if (event.data instanceof Object &&
                event.data.hasOwnProperty('queryMethodListener') &&
                event.data.hasOwnProperty('queryMethodArguments')) {
                this.listeners[event.data.queryMethodListener].apply(this, event.data.queryMethodArguments);
            } else {
                this.defaultListener.call(this, event.data);
            }
        };
    }

    postMessage(message) {
        this.worker.postMessage(message);
    }

    terminate() {
        this.worker.terminate();
    }

    addListener(name, listener) {
        this.listeners[name] = listener;
    }

    removeListener(name) {
        delete this.listeners[name];
    }

    /*
      This functions takes at least one argument, the method name we want to query.
      Then we can pass in the arguments that the method needs.
    */
    sendQuery(queryMethod) {
        if (arguments.length < 1) {
            throw new TypeError('QueryableWorker.sendQuery takes at least one argument');
            return;
        }
        queryMethod = arguments[0];
        const args = Array.prototype.slice.call(arguments, 1);
        if (RLottie.isSafari) {
            this.worker.postMessage({
                'queryMethod': queryMethod,
                'queryMethodArguments': args
            });
        } else {
            const transfer = [];
            for(let i = 0; i < args.length; i++) {
                if (args[i] === undefined) {
                    continue;
                }

                if(args[i] instanceof ArrayBuffer) {
                    transfer.push(args[i]);
                }

                if(args[i].buffer && args[i].buffer instanceof ArrayBuffer) {
                    transfer.push(args[i].buffer);
                }
            }

            this.worker.postMessage({
                'queryMethod': queryMethod,
                'queryMethodArguments': args
            }, transfer);
        }
    }
}

class FrameQueue {
    constructor(maxLength) {
        this.queue = [];
        this.maxLength = maxLength;
    }

    needsMore() {
        return this.queue.length < this.maxLength;
    }

    empty() {
        return !this.queue.length;
    }

    push(element) {
        return this.queue.push(element);
    }

    shift() {
        return this.queue.length ? this.queue.shift() : null;
    }
}

window.RLottie.initApi();

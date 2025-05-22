import subFileChangeHandler from "./subFileChangeHandler.js";
import dlHandler from "./dlHandler.js";
import loadMedia from "./loadMedia.js";
import { onUpdateMediaTime, prepareScenes } from "../subtitleRenderer/index.js";
import { createCSSTextGroup } from "./ui-components.js";

async function initPage(onRaf = () => { }) {
    const container = document.getElementById("container");
    let mediaOffset = 0;
    let subOffset = 0;

    const onMediaOffsetChange = (e) => {
        mediaOffset = parseInt(e.target.value, 10) || 0;
    }
    const onAssOffsetChange = (e) => {
        subOffset = parseInt(e.target.value, 10) || 0;
    }

    const sharedTextGroup = createCSSTextGroup();

    let mediaStart = null;
    let mediaElem = document.querySelector("#mediaPlayer");
    let scenes = [];
    let canRender = false;
    let currentScenes = null;
    /** @type {?LRCParserResult} */
    let convertedRawData = null;
    const mainCycle = () => {
        if (!canRender) return;
        onRaf({ mediaElem, scenes, mediaStart, mediaOffset, subOffset, sharedTextGroup, currentScenes });
        currentScenes = onUpdateMediaTime(mediaElem, mediaStart, scenes, mediaOffset, subOffset, sharedTextGroup, currentScenes);
        requestAnimationFrame(mainCycle);
    };

    const onReset = () => {
        if (mediaElem.pause) mediaElem.pause();
    };

    const onMediaFileChange = e => {
        mediaStart = null;
        const f = e.target.files?.[0];
        loadMedia(mediaElem, f, (mediaElem) => mediaElem = mediaElem.currentTime * 1000)
    };

    const onSubDLReq = () => dlHandler(convertedRawData, subOffset);

    const onSubTitleChange = (e) => subFileChangeHandler(e, {
        convertedRawData,
        onConvertedAss: (data) => {
            convertedRawData = data;
        },
        onPrepare: (lyrics) => {
            scenes = prepareScenes(container, lyrics, sharedTextGroup);
        },
    })

    mediaElem.addEventListener("play", () => {
        canRender = true;
        document.querySelector("#settingsDialog").removeAttribute('open');
        mainCycle();
    });

    return {
        container,
        onReset,
        onMediaFileChange,
        onSubTitleChange,
        onmediaOffsetChange: onMediaOffsetChange,
        onAssOffsetChange,
        onSubDLReq
    };
}

function setupEventListeners(pageObj) {
    document.getElementById("mediaFile").addEventListener("change", pageObj.onMediaFileChange);
    document.getElementById("subFile").addEventListener("change", pageObj.onSubTitleChange);
    document.getElementById('mediaOffset').addEventListener('input', pageObj.onMediaOffsetChange);
    document.getElementById('subOffset').addEventListener('input', pageObj.onAssOffsetChange);
    document.getElementById('fontSize').addEventListener('input', ev => {
        const fontSize = ev.target.value;
        document.getElementById('container').style.fontSize = fontSize + 'px';
    });
    document.getElementById('assOffIsNeg').addEventListener('change', ev => {
        if (ev.target.checked) {
            document.getElementById('subOffset').value = -Math.abs(document.getElementById('subOffset').value);
        } else {
            document.getElementById('subOffset').value = Math.abs(document.getElementById('subOffset').value);
        }
        document.getElementById('subOffset').dispatchEvent(new Event('input'));
    });
    document.getElementById('mediaOffIsNeg').addEventListener('change', ev => {
        if (ev.target.checked) {
            document.getElementById('mediaOffset').value = -Math.abs(document.getElementById('mediaOffset').value);
        } else {
            document.getElementById('mediaOffset').value = Math.abs(document.getElementById('mediaOffset').value);
        }
        document.getElementById('mediaOffset').dispatchEvent(new Event('input'));
    });
    document.getElementById('convertedSubDL').addEventListener('click', pageObj.onSubDLReq);

    // mediaControlHeight (input)
    document.getElementById('mediaControlHeight').addEventListener('input', ev => {
        document.getElementById('container').style.setProperty('--media-control-height', ev.target.value + 'rem');
    });
}

export { initPage, setupEventListeners };
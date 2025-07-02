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
    const mediaElem = document.querySelector("#mediaPlayer");
    let scenes = [];
    let canRender = false;
    let currentScenes = null;
    /** @type {?LRCParserResult} */
    let convertedRawData = null;
    let showKaraokeBgLine = true;
    const onToggleBgKaraokeLine = (e) => showKaraokeBgLine = e.target.checked;

    let animationMode = "scale"; // 기본값

    // 드롭다운 이벤트 핸들러
    const onAnimationModeChange = (e) => {
        animationMode = e.target.value;
    };

    let posterPosition = "50% 1em";
    const onPosterPosChange = (e) => {
        posterPosition = e.target.value;
        mediaElem.style.objectPosition = posterPosition;
    }
    const mainCycle = () => {
        if (!canRender) return;
        onRaf({ mediaElem, scenes, mediaStart, mediaOffset, subOffset, sharedTextGroup, currentScenes, showKaraokeBgLine, animationMode });
        currentScenes = onUpdateMediaTime(mediaElem, mediaStart, scenes, mediaOffset, subOffset, sharedTextGroup, currentScenes, showKaraokeBgLine, animationMode);
        requestAnimationFrame(mainCycle);
    };

    const onReset = () => {
        if (mediaElem.pause) mediaElem.pause();
    };

    const onMediaFileChange = e => {
        mediaStart = null;
        const f = e.target.files?.[0];
        loadMedia(mediaElem, f, (mediaElem) => mediaElem = mediaElem.currentTime * 1000, posterPosition)
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
        onMediaOffsetChange,
        onAssOffsetChange,
        onSubDLReq,
        onToggleBgKaraokeLine,
        onAnimationModeChange,
        onPosterPosChange
    };
}

function setupEventListeners(pageObj) {
    const container = document.getElementById("container");
    const mediaFile = document.getElementById('mediaFile');
    const subFile = document.getElementById('subFile');

    // inputs (number or text)

    const mediaOffset = document.getElementById('mediaOffset');
    const subOffset = document.getElementById('subOffset');
    const fontSize = document.getElementById('fontSize');
    const mediaControlHeight = document.getElementById('mediaControlHeight');
    const posterPosition = document.getElementById('posterPosition');

    // checkboxs

    const assOffIsNeg = document.getElementById('assOffIsNeg');
    const mediaOffIsNeg = document.getElementById('mediaOffIsNeg');
    const toggleBgKaraokeLine = document.getElementById('toggleBgKaraokeLine');

    // buttons
    const convertedSubDL = document.getElementById('convertedSubDL');

    // dropdown selection
    const animationMode = document.getElementById('animationMode');

    mediaFile.addEventListener("change", pageObj.onMediaFileChange);
    subFile.addEventListener("change", pageObj.onSubTitleChange);
    mediaOffset.addEventListener('input', pageObj.onMediaOffsetChange);
    subOffset.addEventListener('input', pageObj.onAssOffsetChange);
    toggleBgKaraokeLine.addEventListener('change', pageObj.onToggleBgKaraokeLine);

    fontSize.addEventListener('input', ev => {
        const s = ev.target.value;
        container.style.fontSize = s + 'px';
    });
    assOffIsNeg.addEventListener('change', ev => {
        if (ev.target.checked) {
            subOffset.value = -Math.abs(subOffset.value);
        } else {
            subOffset.value = Math.abs(subOffset.value);
        }
        subOffset.dispatchEvent(new Event('input'));
    });
    mediaOffIsNeg.addEventListener('change', ev => {
        if (ev.target.checked) {
            mediaOffset.value = -Math.abs(mediaOffset.value);
        } else {
            mediaOffset.value = Math.abs(mediaOffset.value);
        }
        mediaOffset.dispatchEvent(new Event('input'));
    });
    convertedSubDL.addEventListener('click', pageObj.onSubDLReq);

    // mediaControlHeight (input)
    mediaControlHeight.addEventListener('input', ev => {
        container.style.setProperty('--media-control-height', ev.target.value + 'rem');
    });
    animationMode.addEventListener('change', pageObj.onAnimationModeChange);
    posterPosition.addEventListener('input', pageObj.onPosterPosChange);
}

export { initPage, setupEventListeners };
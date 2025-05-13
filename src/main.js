// import { parse as parseASS, stringify as stringifyASS, compile as compileASS, decompile as decompileASS } from 'ass-compiler';
import { parse as parseASS } from './ass-compiler/index.js';
import genCandyMap from './genCandyMap.js';
import genCandySelOpts from './genCandySelOpts.js';
import { GUI, loadAudio, parseAegisubColor } from './htmlUtils.js';
import lrc2ass from './lrc2ass/index.js';
import showASSDupCheck from './showASSDupCheck.js';
/** @typedef {import('./ass-compiler/type.js').ASSParseResult} ASSParseResult */
/** @typedef {import('./lrc2ass/parser.js').ParserResult} LRCParserResult */
function finalizeSelectedLines(candidateMap, styleDB, selectedIds = []) {
    const resultMap = new Map();
    const selectableIDs = selectedIds;
    for (const id of selectableIDs) {
        const [key, indexStr] = id.split("__");
        const index = parseInt(indexStr, 10);
        let candidateData = candidateMap.get(key);
        const candidate = candidateData[index];
        let segments = candidate.segments;
        const styleKey = candidate.styleKey;
        /*
        PrimaryColour ='&H00FFFFFF'; // white, after highlighted.
        SecondaryColour ='&H006E6E72'; // gray, before highlighted.
        */
        const styleData = styleDB.style?.find(s => s.Name === styleKey);
        const style = {
            PrimaryColour: styleData?.PrimaryColour ? parseAegisubColor(styleData.PrimaryColour) : null,
            SecondaryColour: styleData?.SecondaryColour ? parseAegisubColor(styleData.SecondaryColour) : null
        };


        if (!resultMap.has(key)) {
            resultMap.set(key, { start: candidate.start, end: candidate.end, styleKey: styleKey, lines: [] });
        }
        resultMap.get(key).lines.push({ segments: segments, style });
    }

    return [...resultMap.values()];
}
async function subtitleDLRequest(convertRawData, subOffset = 0) {
    if (!convertRawData) return;
    const orignalFileName = convertRawData.fileName;
    const fileName = `${orignalFileName}.ass`;
    convertRawData.lines.forEach(line => {
        line.time = line.time + subOffset;
    });
    let { assContent, lrcData } = await lrc2ass(convertRawData);
    const genBlobUrl = URL.createObjectURL(new Blob([assContent], { type: "text/plain;charset=utf-8" }));
    const a = document.createElement('a');
    a.href = genBlobUrl;
    a.download = fileName;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(genBlobUrl);
    }, 100);
    if (lrcData) convertRawData = lrcData;
}
async function initPage(onRaf = () => { }) {
    const container = document.getElementById("container");

    // 오디오 및 자막 오프셋 컨트롤
    // const controlDiv = GUI.genOffsetCtrls();
    // container.appendChild(controlDiv);

    let audioOffset = 0;
    let subOffset = 0;

    const onAudioOffsetChange = (e) => {
        audioOffset = parseInt(e.target.value, 10) || 0;
    }
    const onAssOffsetChange = (e) => {
        subOffset = parseInt(e.target.value, 10) || 0;
    }

    const sharedTextGroup = GUI.createCSSTextGroup();

    let audioStart = null;
    let audioElem = document.querySelector("#audioPlayer");
    let scenes = [];
    let canRender = false;
    let currentScenes = null;
    /** @type {?LRCParserResult} */
    let convertRawData = null;
    const mainCycle = () => {
        if (!canRender) return;
        onRaf({ audioElem, scenes, audioStart, audioOffset, subOffset, sharedTextGroup, currentScenes });
        requestAnimationFrame(mainCycle);
    };

    const onReset = () => {
        if (audioElem.pause) audioElem.pause();
    };
    const onSetAudio = (urlOrFile) => {
        if (!urlOrFile) return;
        loadAudio(audioElem, urlOrFile);
        audioStart = audioElem.currentTime * 1000;
    };
    const onAudioFileChange = e => {
        audioStart = null;
        onSetAudio(e.target.files[0]);
    };

    const onSubDLReq = () => subtitleDLRequest.call(null, convertRawData, subOffset);

    const onSubTitleChange = async e => {
        /** 
         * Download button element for converted subtitles
         * @type {HTMLButtonElement|null}
         */
        let dlBtn = document.getElementById('convertedSubDL');
        if (dlBtn) {
            dlBtn.disabled = true;
            /**
             * Updates the button's visual appearance based on its disabled state
             * Changes between success and secondary button styles
             * @this {HTMLButtonElement}
             * @returns {void}
             */
            dlBtn.updateSuccessVisual = function () {
                if (this.disabled) {
                    if (this.classList.contains('btn-outline-success')) {
                        this.classList.remove('btn-outline-success');
                        this.classList.add('btn-outline-secondary');
                    }
                } else {
                    if (this.classList.contains('btn-outline-secondary')) {
                        this.classList.remove('btn-outline-secondary');
                        this.classList.add('btn-outline-success');
                    }

                }
            };
            dlBtn.updateSuccessVisual();
        }
        if (!e.target.files[0]) return;

        // first, i need to get file extension
        const ext = e.target.files[0].name.split('.').pop();
        let text = await e.target.files[0].text();

        // convert lrc to ass file format. when if file extension is lrc.
        if (ext !== 'ass' && ext === "lrc") {
            let { assContent, lrcData } = await lrc2ass(text, ev => console.log(ev));
            if (assContent) text = assContent;
            if (lrcData) {convertRawData = lrcData;
                // for download.
                lrcData.fileName = e.target.files[0].name; 
            }
            if (dlBtn && dlBtn.updateSuccessVisual) {
                dlBtn.disabled = false;
                dlBtn.updateSuccessVisual();
            }
        }

        /** @type {ASSParseResult} */
        const parsed = await new Promise(async (resolve, reject) => {
            parseASS.addEventListener('progress', (e) => {
                const rawPct = (e.loaded / e.total) * 100;
                // 소수 둘째 자리에서 버림
                const dispPct = (Math.floor(rawPct * 100) / 100).toFixed(2);
                console.log(`ASS ParseProgress: ${dispPct}% (${e.loaded}/${e.total})`);
            });
            parseASS.parse(text).then(resolve).catch(reject);
        }).catch(e => { console.error(e) });
        if (!parsed) return;
        console.log(`========= ASS Parse Result =========
전처리 소비시간:${parsed.PERFORMANCE_PRE.diff.toFixed(2)}ms

후처리 소비시간:${parsed.PERFORMANCE_AFTER.diff.toFixed(2)}ms`);

        // get displaylable lyrics (each item of array has the following format)
        const candidateMap = genCandyMap(parsed.nonKaraokes.concat(parsed.karaokes));
        const selectionList = genCandySelOpts(candidateMap);
        showASSDupCheck(selectionList, selectedIds => {
            const lyrics = finalizeSelectedLines(candidateMap, parsed.styles, selectedIds);
            scenes = GUI.prepareScenes(container, lyrics, sharedTextGroup);
        });
    };
    audioElem.addEventListener("play", () => {
        canRender = true;
        mainCycle();
    });

    return { container, onReset, onAudioFileChange, onSubTitleChange, onAudioOffsetChange, onAssOffsetChange, onSubDLReq };
}
await new Promise(r => window.onload = () => r());
initPage(({ audioElem, scenes, audioStart, audioOffset, subOffset, sharedTextGroup, currentScenes }) => {
    currentScenes = GUI.onUpdateAudioTime(audioElem, audioStart, scenes, audioOffset, subOffset, sharedTextGroup, currentScenes);
}).then(p => {
    // document.getElementById("reset-btn").addEventListener("click", p.onReset);
    document.getElementById("audioFile").addEventListener("change", p.onAudioFileChange);
    document.getElementById("subFile").addEventListener("change", p.onSubTitleChange);
    document.getElementById('audioOffset').addEventListener('input', p.onAudioOffsetChange);
    document.getElementById('subOffset').addEventListener('input', p.onAssOffsetChange);
    document.getElementById('fontSize').addEventListener('input', ev => {
        const fontSize = ev.target.value;
        // data-font-size
        document.getElementById('container').style.fontSize = fontSize + 'px';
    });
    //assOffIsNeg, audioOffIsNeg (checkbox for to Set value as negative or not, target is subOffset, audioOffset)
    document.getElementById('assOffIsNeg').addEventListener('change', ev => {
        if (ev.target.checked) {
            document.getElementById('subOffset').value = -Math.abs(document.getElementById('subOffset').value);
        } else {
            document.getElementById('subOffset').value = Math.abs(document.getElementById('subOffset').value);
        }
        //manually trigger input event
        document.getElementById('subOffset').dispatchEvent(new Event('input'));
    });
    document.getElementById('audioOffIsNeg').addEventListener('change', ev => {
        if (ev.target.checked) {
            document.getElementById('audioOffset').value = -Math.abs(document.getElementById('audioOffset').value);
        } else {
            document.getElementById('audioOffset').value = Math.abs(document.getElementById('audioOffset').value);
        }
        //manually trigger input event
        document.getElementById('audioOffset').dispatchEvent(new Event('input'));
    });
    document.getElementById('convertedSubDL').addEventListener('click', p.onSubDLReq);
});
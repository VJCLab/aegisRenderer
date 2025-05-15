import { default as parseASS } from '../ass-compiler/index.js';
import genCandyMap from './genCandyMap.js';
import genCandySelOpts from './genCandySelOpts.js';
import { default as lrc2ASS } from '../lrc2ass/index.js';
import showASSDupCheck from './showASSDupCheck.js';
import { buttonStateVisualEnchant, finalizeSelectedLines } from './ui-components.js';

/** @typedef {import('./ass-compiler/type.js').ASSParseResult} ASSParseResult */
/** @typedef {import('./lrc2ass/type.js').ParserResult} LRCParserResult */

async function subFileChangeHandler(e, {
    convertedRawData,
    onConvertedAss = (d) => { },
    onPrepare = (lyrics) => {
        console.log(lyrics);
    },
}) {
    /** 
     * Download button element for converted subtitles
     * @type {HTMLButtonElement|null}
     */
    let dlBtn = document.getElementById('convertedSubDL');
    if (dlBtn) {
        dlBtn.disabled = true;
        buttonStateVisualEnchant(dlBtn);
        dlBtn.updateSuccessVisual();
    }
    if (!e.target.files[0]) return;

    // first, i need to get file extension
    const ext = e.target.files[0].name.split('.').pop();
    let text = await e.target.files[0].text();
    // check file extension
    if (!(ext === 'ass' || ext === 'lrc')) {
        e.target.files = null;
        e.target.value = '';
        throw new Error(`Unsupported file extension: ${ext}`);
    }
    // convert lrc to ass file format. when if file extension is lrc.
    if (ext !== 'ass' && ext === "lrc") {
        lrc2ASS.addEventListener('progress', (e) => {
            const phase = e.phase;
            const rawPct = (e.loaded / e.total) * 100;
            // 소수 둘째 자리에서 버림
            const dispPct = (Math.floor(rawPct * 100) / 100).toFixed(2);
            const msg = `LRC ${phase} Progress: ${dispPct}% (${e.loaded}/${e.total})`;
            console.log(msg);
        });

        let { assContent, lrcData } = await lrc2ASS.convert(text, ev => console.log(ev));
        if (assContent) text = assContent;
        if (lrcData) {
            // for download.
            lrcData.fileName = e.target.files[0].name;
            convertedRawData = lrcData;
            onConvertedAss(convertedRawData);
        }
        if (dlBtn && dlBtn.updateSuccessVisual) {
            dlBtn.disabled = false;
            dlBtn.updateSuccessVisual();
        }
        console.log(`========= LRC Convert Result =========
LRC 파싱 소요시간:${convertedRawData.PERFORMANCE_PRE.diff.toFixed(2)}ms
LRC -> ASS 변환 소요시간:${convertedRawData.PERFORMANCE_AFTER.diff.toFixed(2)}ms`);
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

    const candidateMap = genCandyMap(parsed.nonKaraokes.concat(parsed.karaokes));
    const selectionList = genCandySelOpts(candidateMap);
    showASSDupCheck(selectionList, selectedIds => {
        const lyrics = finalizeSelectedLines(candidateMap, parsed.styles, selectedIds);
        onPrepare(lyrics);
    });
};

export default subFileChangeHandler;
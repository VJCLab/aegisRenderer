/** @typedef {import("./type.js").ParserResult} ParserResult */
/** @typedef {import("./type.js").Lyric} Lyric */

const timeFieldExp = /^(?:\[[\d:.]+\])+/g;
const timeExp = /\d{1,3}(:\d{1,3}){0,2}(?:\.\d{1,3})/g;

const formatTimeLabel = (label) => {
    const t_rxp_1 = /^0+(\d+)/;
    const t_rxp_2 = /:0+(\d+)/g;
    const t_rxp_3 = /\.0+(\d+)/;
    return label.replace(t_rxp_1, '$1')
        .replace(t_rxp_2, ':$1')
        .replace(t_rxp_3, '.$1');
};

/**
 * 
 * @param {string} lyric - raw lyric File text
 * @param {boolean} removeBlankLine
 * @param {(ProgressEvent)=>void} onParseProgress progress callback
 * @returns {ParserResult}
 */
function parse(lyric = "", removeBlankLine = false, onParseProgress = d => { }, onParseComplete = d => { }) {
    const PERFORMANCE_PRE = {
        start: performance.now(),
        end: null,
        diff: null
    };

    /** @type {Lyric[]} */
    let lines = lyric.split(/\r\n|\n|\r/);
    const linesMap = {};
    const length = lines.length;

    for (let i = 0; i < length; i++) {
        const line = lines[i].trim();
        let result = timeFieldExp.exec(line);
        if (result) {
            const timeField = result[0];
            const text = line.replace(timeFieldExp, '').trim();
            if (text || !removeBlankLine) {
                const times = timeField.match(timeExp);
                if (times == null)
                    continue;
                for (let time of times) {
                    const timeStr = formatTimeLabel(time);
                    if (linesMap[timeStr]) {
                        linesMap[timeStr].extendedLyrics.push(text);
                        continue;
                    }
                    const timeArr = timeStr.split(':');
                    if (timeArr.length > 3)
                        continue;
                    else if (timeArr.length < 3)
                        for (let i = 3 - timeArr.length; i--;)
                            timeArr.unshift('0');
                    if (timeArr[2].includes('.'))
                        timeArr.splice(2, 1, ...timeArr[2].split('.'));
                    linesMap[timeStr] = {
                        rawTime: timeStr,
                        time: parseInt(timeArr[0]) * 60 * 60 * 1000 + parseInt(timeArr[1]) * 60 * 1000 + parseInt(timeArr[2]) * 1000 + parseInt(timeArr[3] || '0'),
                        text,
                        extendedLyrics: [],
                    };
                }
            }
        }

        // 진행 상황 메인 스레드에 전송
        if (i % 100 === 0 || i === length - 1) {  // 성능 최적화를 위해 모든 라인마다가 아닌 주기적으로 전송
            onParseProgress({
                type: 'progress',
                progress: {
                    lengthComputable: true,
                    loaded: i + 1,
                    total: length
                }
            });
        }
    }

    lines = Object.values(linesMap);
    lines.sort((a, b) => {
        return a.time - b.time;
    });

    PERFORMANCE_PRE.end = performance.now();
    PERFORMANCE_PRE.diff = PERFORMANCE_PRE.end - PERFORMANCE_PRE.start;
    const result = {
        lines,
        maxLine: length - 1,
        PERFORMANCE_PRE
    };
    onParseComplete({
        type: 'done', result
    });
    return result;
};

self.onmessage = (e) => {
    const text = e.data.rawText;
    const isRemoveBlankLine = e.data.isRemoveBlankLine;

    parse(text, isRemoveBlankLine, self.postMessage, self.postMessage);
};
export default parse;
export { parse, formatTimeLabel };
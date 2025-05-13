const timeFieldExp = /^(?:\[[\d:.]+\])+/g;
const timeExp = /\d{1,3}(:\d{1,3}){0,2}(?:\.\d{1,3})/g;
const t_rxp_1 = /^0+(\d+)/;
const t_rxp_2 = /:0+(\d+)/g;
const t_rxp_3 = /\.0+(\d+)/;
const formatTimeLabel = (label) => {
    return label.replace(t_rxp_1, '$1')
        .replace(t_rxp_2, ':$1')
        .replace(t_rxp_3, '.$1');
};
function parseExtendedLyric(lrcLinesMap, extendedLyric) {
    const extendedLines = extendedLyric.split(/\r\n|\n|\r/);
    for (let i = 0; i < extendedLines.length; i++) {
        const line = extendedLines[i].trim();
        let result = timeFieldExp.exec(line);
        if (result) {
            const timeField = result[0];
            const text = line.replace(timeFieldExp, '').trim();
            if (text) {
                const times = timeField.match(timeExp);
                if (times == null)
                    continue;
                for (let time of times) {
                    const timeStr = formatTimeLabel(time);
                    const targetLine = lrcLinesMap[timeStr];
                    if (targetLine)
                        targetLine.extendedLyrics.push(text);
                }
            }
        }
    }
};

/**
 * @typedef {object} Lyric
 * @property {string} rawTime - unparsed lyric time.
 * @property {number} time - milliseconds time from 0.
 * @property {string} text - lyric text.
 * @property {string[]} extendedLyrics - might be translated lyrics array.
 */

/**
 * @typedef {Object} ParserResult
 * @property {Lyric[]} lines - lyric lines
 * @property {number} maxLine - max line number
 */

/**
 * 
 * @param {string} lyric - raw lyric File text
 * @param {boolean} isRemoveBlankLine 
 * @returns {ParserResult}
 */
function lrcParser(lyric = "", isRemoveBlankLine = false) {
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
            if (text || !isRemoveBlankLine) {
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
    }
    lines = Object.values(linesMap);
    lines.sort((a, b) => {
        return a.time - b.time;
    });

    return { lines, maxLine: length - 1 };
}
export default lrcParser;
export { lrcParser, parseExtendedLyric, formatTimeLabel };
import { parseDialogue } from 'https://cdn.jsdelivr.net/npm/ass-compiler@0.1.15/src/parser/dialogue.js';
import { parseFormat } from 'https://cdn.jsdelivr.net/npm/ass-compiler@0.1.15/src/parser/format.js';
import { parseStyle } from 'https://cdn.jsdelivr.net/npm/ass-compiler@0.1.15/src/parser/style.js';
/** @typedef {import("./type.js").ASSParseResult} ASSParseResult */
/** @typedef {import("./type.js").ASSFormat} ASSFormat */
/** @typedef {import("./type.js").ASSStyle} ASSStyle */
/** @typedef {import("./type.js").ASSComment} ASSComment */
/** @typedef {import("./type.js").ASSDialogue} ASSDialogue */
/** @typedef {import("./type.js").onParseProgress} onParseProgress */
/** @typedef {import("./type.js").onParseComplete} onParseComplete */

/**
 * ASS 텍스트를 전처리하여 기본 구조로 변환합니다.
 * @function preProcess
 * @param {string} text - 파싱할 ASS 스크립트 텍스트
 * @param {onParseProgress} [onParseProgress] - 진행 상황 콜백 함수
 * @returns {ASSParseResult} 전처리된 ASS 구조
 */
function preProcess(text, onParseProgress = d => { }) {
    const tree = {
        info: {},
        styles: { format: [], style: [] },
        events: { format: [], comment: [], dialogue: [] },
        PERFORMANCE_PRE: {
            start: performance.now(),
            end: null,
            diff: null
        },
        PERFORMANCE_AFTER: {
            start: null,
            end: null,
            diff: null
        }
    };

    const lines = text.split(/\r?\n/);
    const total = lines.length;
    let state = 0;
    // throw new Error('not implemented');
    for (let i = 0; i < total; i++) {
        const line = lines[i].trim();
        if (/^;/.test(line)) continue;

        // state 전환 로직
        if (/^\[Script Info\]/i.test(line)) state = 1;
        else if (/^\[V4\+? Styles\]/i.test(line)) state = 2;
        else if (/^\[Events\]/i.test(line)) state = 3;
        else if (/^\[.*\]/.test(line)) state = 0;

        // 파싱 로직
        if (state === 1 && /:/.test(line)) {
            const [, key, value] = line.match(/(.*?)\s*:\s*(.*)/);
            tree.info[key] = value;
        }
        if (state === 2) {
            if (/^Format\s*:/i.test(line)) {
                tree.styles.format = parseFormat(line);
            } else if (/^Style\s*:/i.test(line)) {
                tree.styles.style.push(parseStyle(line, tree.styles.format));
            }
        }
        if (state === 3) {
            if (/^Format\s*:/i.test(line)) {
                tree.events.format = parseFormat(line);
            } else if (/^(?:Comment|Dialogue)\s*:/i.test(line)) {
                const [, key, value] = line.match(/^(\w+?)\s*:\s*(.*)/i);
                let parsedDialogue = parseDialogue(value, tree.events.format);
                if (parsedDialogue.Start != 0 || parsedDialogue.End != 0)
                    tree.events[key.toLowerCase()]
                        .push(parsedDialogue);
            }
        }

        // 진행 상황 메인 스레드에 전송
        if (i % 100 === 0 || i === total - 1) {  // 성능 최적화를 위해 모든 라인마다가 아닌 주기적으로 전송
            onParseProgress({
                type: 'progress',
                progress: {
                    lengthComputable: true,
                    loaded: i + 1,
                    total
                }
            })
        }
    };
    tree.PERFORMANCE_PRE.end = performance.now();
    tree.PERFORMANCE_PRE.diff = tree.PERFORMANCE_PRE.end - tree.PERFORMANCE_PRE.start;
    return tree;
}

/**
 * item 객체 내부의 tags 배열을 검색하여 k 속성을 가진 첫 번째 태그를 찾아
 * k 값을 timeFactor만큼 곱합니다. 기본값인 10을 곱하면 센티초 단위가 밀리초 단위로 변환됩니다.
 * 이 함수는 item 객체와 그 내부의 tags 배열이 유효하고, 
 * k 속성이 유효한 숫자 값으로 존재하는 태그를 찾을 경우에만 작동합니다.
 *
 * @function multiplyKtagTime
 * @param {object} item - 태그 정보를 포함하는 객체입니다.
 * @param {Array<object>} item.tags - 태그 객체의 배열입니다. 각 태그 객체는 'k' 속성을 가질 수 있습니다.
 * @param {number} [timeFactor=10] - 'k' 값을 곱할 배수입니다. 기본값은 10으로, 센티초를 밀리초로 변환합니다.
 * @returns {void} 이 함수는 입력된 item 객체의 태그 중 첫 번째로 찾은 유효한 'k' 값을 직접 수정하며, 별도의 값을 반환하지 않습니다.
 */
function multiplyKtagTime(item, timeFactor = 10) {
    if (
        item &&                            // item 객체가 유효한지 확인
        Array.isArray(item.tags) &&        // item.tags가 배열인지 확인
        item.tags.length > 0            // item.tags에 최소 하나 이상의 요소가 있는지 확인
    ) {
        // item.tags[0].k *= timeFactor;
        // 태그 배열을 순회하며 k 속성이 있는 태그를 찾음
        for (const tag of item.tags) {
            // 현재 태그가 유효하고 k 속성이 숫자이며 0보다 큰지 확인
            if (tag && typeof tag.k === 'number' && tag.k > 0) {
                // 조건을 만족하는 첫 번째 태그의 k 값에 timeFactor를 곱함
                tag.k *= timeFactor;
                return; // 첫 번째 유효한 태그를 찾아 처리했으므로 함수 종료
            }
        }

        // 유효한 k 속성을 가진 태그를 찾지 못한 경우 함수 종료
        return;
    }
}

// isRawKaraoke 함수에서 사용할 정규 표현식입니다.
// \\k 태그와 그 뒤의 텍스트를 찾습니다. 예: {\\k35}La
// g 플래그는 test 메소드와 함께 사용할 때 lastIndex 상태 관리 문제로 제거했습니다.
const RAW_KARAOKE_REGEX = /\{\\k(\d+)\}([^\\{]+)/;

/**
 * 주어진 ASS 이벤트 객체가 원시 가라오케 태그 형식의 텍스트를 포함하는지 확인합니다.
 *
 * @param {object} event - 확인할 ASS 이벤트 객체입니다.
 * @param {object} [event.Text] - 이벤트의 텍스트 정보를 담고 있는 객체입니다.
 * @param {string} [event.Text.raw] - 처리되지 않은 원시 텍스트 문자열입니다.
 * @returns {boolean} 원시 가라오케 태그를 포함하면 true, 그렇지 않으면 false를 반환합니다.
 */
const isRawKaraoke = (event) => event?.Text?.raw && RAW_KARAOKE_REGEX.test(event.Text.raw);

/**
 * 주어진 이벤트의 타입을 분류하여 문자열로 반환합니다.
 * @param {object} event - 분류할 이벤트 객체입니다.
 * @param {function} isRawKaraokeFn - isRawKaraoke 함수에 대한 참조입니다.
 * @returns {string|null} 이벤트 타입 ("karaoke", "description") 또는 분류할 수 없는 경우 null을 반환합니다.
 */
function getEventType(event, isRawKaraokeFn) {
    if (!event?.Text?.raw) {
        return null; // 처리할 수 없는 이벤트
    }

    const isEffectKaraoke = event.Effect?.name === "karaoke";
    const isRawTagKaraoke = isRawKaraokeFn(event); // 제공된 isRawKaraoke 함수 사용

    if (isEffectKaraoke || isRawTagKaraoke) {
        return "karaoke";
    } else {
        // 가라오케가 아닌 경우, nonKaraoke 조건 확인
        if (event.Effect?.name === "" || !event.Effect?.name) {
            return "description";
        }
    }
    return null; // 어느 타입에도 해당하지 않는 경우
}
/**
 * 카라오케 이벤트 후처리 (센티초를 밀리초로 변환)
 * @param {ASSDialogue} event 
 */
function karaokeAfterProc(event) {
    if (!event.Text?.parsed || !Array.isArray(event.Text.parsed)) return;
    for (let j = 0; j < event.Text.parsed.length; j++) {
        multiplyKtagTime(event.Text.parsed[j]); // 시간 값 조정
    }
}
/**
 * 일반 설명 이벤트 후처리 (type 할당 및 텍스트 내 \N 치환)
 * @param {ASSDialogue} event 
 */
function descAfterProc(event) {
    if (event.Text?.parsed?.[0]?.text && typeof event.Text.parsed[0].text === 'string') {
        event.Text.parsed[0].text = event.Text.parsed[0].text.replace(/\\N/g, "\n"); // 줄바꿈 문자 처리
    }
}

/**
 * ASS 스크립트를 파싱합니다.
 * @function parse
 * @param {string} text - 파싱할 ASS 스크립트 텍스트
 * @param {onParseProgress} [onParseProgress]
 * @param {onParseComplete} [onParseComplete]
 * @returns {ASSParseResult} 파싱된 ASS 구조
 * @example
 * // ASS 파일 파싱하기
 * const assText = '가져온 ASS 파일 텍스트';
 * const result = parse(assText, 
 *   (progress) => console.log(`${progress.progress.loaded}/${progress.progress.total} 처리됨`),
 *   (complete) => console.log('파싱 완료:', complete.result)
 * );
 */
function parse(text, onParseProgress = d => { }, onParseComplete = d => { }) {
    // 전처리
    const tree = preProcess(text, onParseProgress);
    // 후처리
    tree.PERFORMANCE_AFTER.start = performance.now();

    const karaokeEvents = [];
    const nonKaraokeEvents = [];
    const comments = tree.events?.comment || [];
    const dialogues = tree.events?.dialogue || [];
    // 이벤트를 분류하고, 해당 타입에 맞는 후처리까지 수행하는 함수
    const processAndPostProcessList = (list) => {
        for (let i = 0; i < list.length; i++) {
            const event = list[i]; // 이 event 객체가 직접 수정됩니다.
            const eventType = getEventType(event, isRawKaraoke); // isRawKaraoke 함수를 전달

            if (eventType === "karaoke") {
                // 가라오케 이벤트 후처리
                event.type = "karaoke";
                karaokeAfterProc(event);
                karaokeEvents.push(event);
            } else if (eventType === "description") {
                // 일반 설명 이벤트 후처리
                event.type = "description";
                descAfterProc(event);
                nonKaraokeEvents.push(event);
            }
            // eventType이 null이거나 다른 값인 경우 (즉, karaoke도 description도 아닌 경우)
            // 아무 작업도 하지 않고 다음 이벤트로 넘어갑니다.
        }
    };

    processAndPostProcessList(comments);
    processAndPostProcessList(dialogues);

    tree.karaokes = karaokeEvents;
    tree.nonKaraokes = nonKaraokeEvents;

    tree.PERFORMANCE_AFTER.end = performance.now();
    tree.PERFORMANCE_AFTER.diff = tree.PERFORMANCE_AFTER.end - tree.PERFORMANCE_AFTER.start;
    // 완료 이벤트 전송
    onParseComplete({ type: 'done', result: tree });
    return tree;
}
self.onmessage = (e) => {
    const text = e.data;
    parse(text, self.postMessage, self.postMessage);
};
export default parse;

/**
 * @typedef {Object} ParsedTag
 * @property {0|1|2|3|5|6|7|9|10|11} [a] - Alignment
 * @property {string} [a1] - Alpha
 * @property {string} [a2] - Alpha
 * @property {string} [a3] - Alpha
 * @property {string} [a4] - Alpha
 * @property {string} [alpha] - Alpha
 * @property {0|1|2|3|4|5|6|7|8|9} [an] - Angle
 * @property {0|1} [b] - Bold
 * @property {number} [be] - Border
 * @property {number} [blur] - Blur
 * @property {number} [bord] - Border
 * @property {string} [c1] - Color 1
 * @property {string} [c2] - Color 2
 * @property {string} [c3] - Color 3
 * @property {string} [c4] - Color 4
 * @property {{inverse: boolean, scale: number, drawing?: string[][], dots?: [number, number, number, number]}} [clip] - Clip
 * @property {[number, number]} [fad] - Fade
 * @property {[number, number, number, number, number, number]} [fade] - Fade
 * @property {number} [fax] - Font axis X
 * @property {number} [fay] - Font axis Y
 * @property {number} [fe] - Font effect
 * @property {string} [fn] - Font name
 * @property {number} [fr] - Font rotation
 * @property {number} [frx] - Font rotation X
 * @property {number} [fry] - Font rotation Y
 * @property {number} [frz] - Font rotation Z
 * @property {string} [fs] - Font size
 * @property {number} [fscx] - Font scale X
 * @property {number} [fscy] - Font scale Y
 * @property {number} [fsp] - Font spacing
 * @property {0|1} [i] - Italic
 * @property {number} [k] - Karaoke
 * @property {number} [kf] - Karaoke fade
 * @property {number} [ko] - Karaoke override
 * @property {number} [kt] - Karaoke time
 * @property {number} [K] - Karaoke
 * @property {Array<number>} [move] - Move
 * @property {Array<number>} [org] - Origin
 * @property {number} [p] - Position
 * @property {number} [pbo] - Position border
 * @property {Array<number>} [pos] - Position
 * @property {0|1|2|3} [q] - Rotation
 * @property {string} [r] - Rotate
 * @property {0|1} [s] - Strikeout
 * @property {number} [shad] - Shadow
 * @property {{t1: number, t2: number, accel: number, tags: Array<ParsedTag>}} [t] - Timeline
 * @property {0|1} [u] - Underline
 * @property {number} [xbord] - X border
 * @property {number} [xshad] - X shadow
 * @property {number} [ybord] - Y border
 * @property {number} [yshad] - Y shadow
 */

/**
 * @typedef {Object} ASSFormat
 * @description ASS 포맷 정보
 */

/**
 * @typedef {Object} ASSStyle
 * @description ASS 스타일 정보
 */

/**
 * @typedef {Object} ASSComment - ASS 코멘트 이벤트
 * @property {string} type - 이벤트 타입 ("description")
 * @property {Object} Text - 텍스트 정보
 * @property {string} Text.raw - 원시 텍스트
 * @property {Array} Text.parsed - 파싱된 텍스트 정보
 * @property {Object} Effect - 효과 정보
 * @property {string} Effect.name - 효과 이름
 */

/**
 * @typedef {object} ParsedASSEventTextParsed - 파싱된 대화 텍스트 정보
 * @property {Array<ParsedTag>} tags - 효과 정보
 * @property {string} text - 텍스트
 * @property {string[][]} drawing - 그리기 정보
 */

/**
 * @typedef {Object} ASSDialogue - ASS 대화 이벤트
 * @property {number} Start - 시작 시간
 * @property {number} End - 종료 시간
 * @property {Object} Text - 텍스트 정보
 * @property {string} Text.raw - 원시 텍스트
 * @property {Array<ParsedASSEventTextParsed>} Text.parsed - 파싱된 텍스트 정보
 * @property {Object} Effect - 효과 정보
 * @property {string} Effect.name - 효과 이름
 * @property {string} [type] - 이벤트 타입 ("karaoke" 또는 "description")
 */

/**
 * @typedef {Object} ASSParseResult ASS 파싱 결과
 * @property {Object} info - ASS 스크립트 정보
 * @property {Object} styles - ASS 스타일
 * @property {Array<ASSFormat>} styles.format - 스타일 포맷 정보
 * @property {Array<ASSStyle>} styles.style - 스타일 목록
 * @property {Object} events - ASS 이벤트
 * @property {Array<ASSFormat>} events.format - 이벤트 포맷 정보
 * @property {Array<ASSComment>} events.comment - 코멘트 목록
 * @property {Array<ASSDialogue>} events.dialogue - 대화 목록
 * @property {Array<ASSDialogue>} karaokes - 가라오케 효과가 있는 대화 목록
 * @property {Array<ASSDialogue>} nonKaraokes - 일반 설명 텍스트 목록
 * @property {Object} PERFORMANCE_PRE - 전처리 성능 측정 정보
 * @property {number} PERFORMANCE_PRE.start - 전처리 시작 시간
 * @property {number} PERFORMANCE_PRE.end - 전처리 종료 시간
 * @property {Object} PERFORMANCE_AFTER - 후처리 성능 측정 정보
 * @property {number} PERFORMANCE_AFTER.start - 후처리 시작 시간
 * @property {number} PERFORMANCE_AFTER.end - 후처리 종료 시간
 */

/**
 * @callback onParseComplete 완료 이벤트 콜백 함수
 * @param {{type: 'done', result: ASSParseResult}} result - 파싱된 ASS 구조
 * @returns {void}
 */
/**
 * @callback onParseProgress 프로세스 이벤트 콜백 함수
 * @param {{type: 'progress', progress: ProgressEvent}} progress - 프로세스 정보
 * @returns {void}
 */

export {};
function genCandyMap(datalines = []) {
    const m = new Map();

    for (const line of datalines) {
        const start = Math.floor(line.Start * 1000);
        const end = Math.floor(line.End * 1000);
        const rawText = line.Text.raw;
        const type = line.type;
        const styleKey = line.Style;
        const segments = line.Text.parsed.map(s => ({
            char: s.text,
            duration: s.tags[0]?.k ?? 0
        }));
        const lineData = { type, start, end, text: rawText, styleKey: styleKey, segments };

        // 같은 종료 시간을 가진 항목 찾기
        let matchingKey = findKeyWithSameEndTime(m, end);

        // 기존 키가 있으면 사용, 없으면 새 키 생성
        const key = matchingKey || `${start}-${end}`;

        if (!m.has(key)) {
            m.set(key, []);
        }

        m.get(key).push(lineData);
    }

    return m;
}

function findKeyWithSameEndTime(map, endTime) {
    for (const key of map.keys()) {
        const [, existingEnd] = key.split('-').map(Number);
        if (existingEnd === endTime) {
            return key;
        }
    }
    return null;
}

export default genCandyMap;
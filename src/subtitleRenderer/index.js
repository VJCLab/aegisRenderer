function areSegmentsEqual(segs1, segs2) {
    if (!segs1 || !segs2 || segs1.length !== segs2.length) return false;
    return segs1.every((seg, i) =>
        seg.char === segs2[i].char &&
        seg.duration === segs2[i].duration
    );
}

function arraysEqual(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    if (a.length !== b.length) return false;

    return a.every((aItem, i) => aItem === b[i]);
}

function prepareScenes(container, lyrics, sharedTextGroup) {
    container.appendChild(sharedTextGroup.object);
    const scenes = [];
    for (let i = 0; i < lyrics.length; i++) {
        const block = lyrics[i];
        let segments = block.lines.map(l => {
            return l.segments.map(s => {
                s.style = l.style;
                return s;
            })
        })
        scenes.push({
            start: block.start,
            end: block.end,
            segments,
        });
    }
    return scenes;
}

function updateSharedTextGroup(sharedTextGroup, newSceneSegments) {
    // 기존 라인을 모두 정리하고 새로운 라인 배열을 생성
    const newLines = [];

    // 새 세그먼트가 있는 경우에만 처리
    if (newSceneSegments && newSceneSegments.length > 0) {
        for (let i = 0; i < newSceneSegments.length; i++) {
            const segs = newSceneSegments[i];
            // 빈 세그먼트는 무시
            if (!segs || segs.length === 0) continue;

            // 기존 라인 사용 또는 새 라인 생성
            let lineEl = i < sharedTextGroup.lines.length ? sharedTextGroup.lines[i] : sharedTextGroup.addLine();

            // 이전 세그먼트 찾기
            const prevSegs = (sharedTextGroup.prevLines && i < sharedTextGroup.prevLines.length)
                ? sharedTextGroup.prevLines[i] : null;

            // 세그먼트가 비어있으면 라인 자체를 삭제
            if (!segs || segs.length === 0) {
                if (lineEl.parentNode) {
                    lineEl.parentNode.removeChild(lineEl);
                }
                continue;
            }

            // 세그먼트가 동일하면 애니메이션 상태를 유지
            if (prevSegs && areSegmentsEqual(segs, prevSegs)) {
                // 애니메이션 상태 유지 - 초기화하지 않음
            } else {
                // 다른 경우 DOM 재구성
                lineEl.innerHTML = "";
                for (let j = 0; j < segs.length; j++) {
                    const seg = segs[j];
                    const span = document.createElement("span");
                    span.className = "karaoke-char";
                    span.textContent = seg.char;
                    // 기본 상태 설정
                    span.style.opacity = '0';
                    span.style.transform = 'scale(0.5)';
                    lineEl.appendChild(span);
                }
            }

            newLines.push(lineEl);
        }
    }

    // 사용하지 않는 라인 제거
    for (let i = 0; i < sharedTextGroup.lines.length; i++) {
        const line = sharedTextGroup.lines[i];
        if (!newLines.includes(line) && line.parentNode) {
            line.parentNode.removeChild(line);
        }
    }

    // 라인 배열 업데이트
    sharedTextGroup.lines = newLines;

    // 이전 세그먼트 저장
    sharedTextGroup.prevLines = newSceneSegments ? [...newSceneSegments] : [];
}
function onUpdateScenesLetter(sharedTextGroup, activeScenes, now, subOffset) {
    if (!activeScenes || !sharedTextGroup) return;

    let lineOffset = 0;

    for (let sceneIndex = 0; sceneIndex < activeScenes.length; sceneIndex++) {
        const scene = activeScenes[sceneIndex];
        const start = scene.start + subOffset;
        const nowLocal = now - start;

        for (let localLineIdx = 0; localLineIdx < scene.segments.length; localLineIdx++) {
            const globalLineIdx = lineOffset + localLineIdx;
            if (globalLineIdx >= sharedTextGroup.lines.length) continue;

            const lineEl = sharedTextGroup.lines[globalLineIdx];

            const lineSegs = scene.segments[localLineIdx];
            let offset = 0;

            for (let i = 0; i < lineSegs.length; i++) {
                const seg = lineSegs[i];
                const nonHighlightedCol = seg.style?.SecondaryColour?.hex ?? "#ffffff";
                const highlightedCol = seg.style?.PrimaryColour?.hex;
                /** @type {HTMLSpanElement} */
                const el = lineEl.children[i];
                if (!el) continue;

                if (highlightedCol) el.style.setProperty('--highlight-color', highlightedCol);
                if (nonHighlightedCol) {
                    el.style.setProperty('--nonHighlight-color', nonHighlightedCol);
                    el.color = nonHighlightedCol;
                }
                const t = nowLocal - offset;

                // el.style.color = t > -40 ? highlightedCol : nonHighlightedCol;
                if (t > -40) {
                    if (!el.classList.contains('animate')) {
                        // 애니메이션 적용 전에 초기 상태 설정 (필요시)
                        el.style.opacity = '0';
                        el.style.transform = 'scale(0.5)';

                        // 딜레이 설정 후 애니메이션 클래스 바로 추가
                        el.style.animationDelay = `${Math.max(0, -t)}ms`;
                        el.classList.add('animate');
                    }
                } else {
                    // 애니메이션 시간 이전이면 숨김 상태 유지
                    el.classList.remove('animate');
                    el.style.opacity = '0';
                    el.style.transform = 'scale(0.5)';
                    el.style.animationDelay = '0ms';
                    el.style.color = nonHighlightedCol;
                }

                offset += seg.duration;
            }
        }

        lineOffset += scene.segments.length;
    }
}

function onUpdateMediaTime(mediaElem, mediaStart, scenes, mediaOffset, subOffset, sharedTextGroup, currentScenes) {
    if (!mediaElem) return;
    const now = mediaElem.currentTime * 1000 - mediaStart + mediaOffset;

    // Instead of single activeScene, now we track multiple active scenes
    let activeScenes = [];

    // Find all active scenes at current time
    for (let i = 0; i < scenes.length; i++) {
        const s = scenes[i];
        const start = s.start + subOffset;
        const end = s.end + subOffset;
        if (now >= start && now < end) {
            activeScenes.push(s);
        }
    }

    // Sort scenes by start time to ensure consistent display order
    activeScenes.sort((a, b) => a.start - b.start);

    // Check if scenes have changed
    const hasChanged = !arraysEqual(activeScenes, currentScenes);

    if (hasChanged) {
        // Handle scene changes
        let allSegments = [];

        // Collect all line segments from all active scenes
        for (let i = 0; i < activeScenes.length; i++) {
            const scene = activeScenes[i];
            allSegments = allSegments.concat(scene.segments);
        }

        // Update the text display with all active lines
        updateSharedTextGroup(sharedTextGroup, allSegments);
    }

    // Update letter animations for all active scenes
    onUpdateScenesLetter(sharedTextGroup, activeScenes, now, subOffset);

    return activeScenes; // Return current active scenes to update state
}
export {
    prepareScenes,
    updateSharedTextGroup,
    onUpdateScenesLetter,
    onUpdateMediaTime
};
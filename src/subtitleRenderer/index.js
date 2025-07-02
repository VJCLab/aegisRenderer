function areSegmentsEqual(segs1, segs2) {
    if (!segs1 || !segs2 || segs1.length !== segs2.length) return false;
    return segs1.every((seg, i) =>
        seg.char === segs2[i].char &&
        seg.duration === segs2[i].duration
    );
}

function arraysEqual(a, b) {
    if (!a || !b || a.length !== b.length) return false;
    return a.every((aItem, i) => aItem === b[i]);
}

function getActiveScenes(scenes, now, subOffset) {
    return scenes.filter(s => {
        const start = s.start + subOffset;
        const end = s.end + subOffset;
        return now >= start && now < end;
    }).sort((a, b) => a.start - b.start);
}

function prepareScenes(container, lyrics, sharedTextGroup) {
    if (!container.contains(sharedTextGroup.object)) {
        container.appendChild(sharedTextGroup.object);
    }
    return lyrics.map(block => ({
        start: block.start,
        end: block.end,
        segments: block.lines.map(l =>
            l.segments.map(s => ({ ...s, style: l.style }))
        ),
    }));
}

function setOutlineStyle(seg, span) {
    if (!(seg.style?.OutlineColour && seg.style?.Outline > 0)) return;
    const color = seg.style.OutlineColour.hex;
    const outline = seg.style.Outline;
    span.style.textShadow = Array(4).fill(`0 0 ${outline}px ${color}`).join(',');
}

function renderLine(lineEl, segs, showBg, animationMode) {
    lineEl.innerHTML = "";
    if (showBg !== false) {
        const bg = document.createElement("span");
        bg.className = "karaoke-background-line";
        bg.textContent = segs.map(s => s.char).join('');
        lineEl.appendChild(bg);
    }
    segs.forEach(seg => {
        const span = document.createElement("span");
        span.className = "karaoke-char";
        span.textContent = seg.char;
        span.style.opacity = '0';
        span.style.transform = animationMode === "scale" ? 'scale(0.5)' : 'none';
        setOutlineStyle(seg, span);
        lineEl.appendChild(span);
    });
}

function updateSharedTextGroup(sharedTextGroup, newSegments, showBg, animationMode = "scale") {
    const newLines = [];
    if (newSegments && newSegments.length > 0) {
        for (let i = 0; i < newSegments.length; i++) {
            const segs = newSegments[i];
            if (!segs || segs.length === 0) continue;
            let lineEl = i < sharedTextGroup.lines.length ? sharedTextGroup.lines[i] : sharedTextGroup.addLine();
            const prevSegs = sharedTextGroup.prevLines?.[i];
            if (!areSegmentsEqual(segs, prevSegs)) {
                renderLine(lineEl, segs, showBg, animationMode);
            }
            newLines.push(lineEl);
        }
    }
    // Remove unused lines
    sharedTextGroup.lines.forEach(line => {
        if (!newLines.includes(line) && line.parentNode) line.parentNode.removeChild(line);
    });
    sharedTextGroup.lines = newLines;
    sharedTextGroup.prevLines = newSegments ? [...newSegments] : [];
}

function animateLetters(sharedTextGroup, activeScenes, now, subOffset, showBg, animationMode = "scale") {
    if (!activeScenes || !sharedTextGroup) return;
    let lineOffset = 0;
    for (const scene of activeScenes) {
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
                const nonHighlight = seg.style?.SecondaryColour?.hex ?? "#fff";
                const highlight = seg.style?.PrimaryColour?.hex;
                if (showBg !== false) {
                    const bgEl = lineEl.querySelector('.karaoke-background-line');
                    if (bgEl) {
                        bgEl.style.setProperty('--nonHighlight-color', nonHighlight);
                        bgEl.style.color = nonHighlight;
                    }
                }
                const el = lineEl.querySelectorAll('.karaoke-char')[i];
                if (!el) continue;
                if (highlight) el.style.setProperty('--highlight-color', highlight);
                if (nonHighlight) {
                    el.style.setProperty('--nonHighlight-color', nonHighlight);
                    el.color = nonHighlight;
                }
                const t = nowLocal - offset;
                if (t > -40) {
                    if (!el.classList.contains('animate')) {
                        el.style.opacity = '0';
                        el.style.transform = animationMode === "scale" ? 'scale(0.5)' : 'none';
                        el.classList.toggle('scale-mode', animationMode === "scale");
                        el.classList.toggle('opacity-mode', animationMode === "opacity");
                        el.style.animationDelay = `${Math.max(0, -t)}ms`;
                        el.classList.add('animate');
                    }
                } else {
                    el.classList.remove('animate', 'scale-mode', 'opacity-mode');
                    el.style.opacity = '0';
                    el.style.transform = animationMode === "scale" ? 'scale(0.5)' : 'none';
                    el.style.animationDelay = '0ms';
                    el.style.color = nonHighlight;
                }
                offset += seg.duration;
            }
        }
        lineOffset += scene.segments.length;
    }
}

function onUpdateMediaTime(mediaElem, mediaStart, scenes, mediaOffset, subOffset, sharedTextGroup, currentScenes, showKaraokeBgLine, animationMode) {
    if (!mediaElem) return;
    const now = mediaElem.currentTime * 1000 - mediaStart + mediaOffset;
    const activeScenes = getActiveScenes(scenes, now, subOffset);
    const hasChanged = !arraysEqual(activeScenes, currentScenes);
    if (hasChanged) {
        let allSegments = [];
        activeScenes.forEach(scene => { allSegments = allSegments.concat(scene.segments); });
        updateSharedTextGroup(sharedTextGroup, allSegments, showKaraokeBgLine, animationMode);
    }
    animateLetters(sharedTextGroup, activeScenes, now, subOffset, showKaraokeBgLine, animationMode);
    return activeScenes;
}

export {
    prepareScenes,
    updateSharedTextGroup,
    animateLetters,
    onUpdateMediaTime
};
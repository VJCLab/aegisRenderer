import parseAegisubColor from "../ass-compiler/parseColor.js";

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

/**
 * Updates the button's visual appearance based on its disabled state
 * Changes between success and secondary button styles
 * @param {HTMLButtonElement} btn
 * @returns {void}
 */
function toggleButtonState(btn) {
    if (btn.disabled) {
        if (btn.classList.contains('btn-outline-success')) {
            btn.classList.remove('btn-outline-success');
            btn.classList.add('btn-outline-secondary');
        }
    } else {
        if (btn.classList.contains('btn-outline-secondary')) {
            btn.classList.remove('btn-outline-secondary');
            btn.classList.add('btn-outline-success');
        }
    }
}

function buttonStateVisualEnchant(btn) {
    btn.updateSuccessVisual = () => toggleButtonState(btn);
    return btn;
}

function createCSSTextGroup() {
    const wrapper = document.createElement("div");
    wrapper.className = "karaoke-wrapper";

    return {
        object: wrapper,
        lines: [], // Will store all line elements
        prevLines: [], // Store previous segments here
        addLine: function () {
            const line = document.createElement("div");
            line.className = "karaoke-line";
            this.object.appendChild(line);
            this.lines.push(line);
            return line;
        },
        ensureLines: function (count) {
            // Make sure we have at least 'count' lines
            for (let i = this.lines.length; i < count; i++) {
                this.addLine();
            }
            return this.lines;
        }
    };
}
export { finalizeSelectedLines, buttonStateVisualEnchant, createCSSTextGroup };
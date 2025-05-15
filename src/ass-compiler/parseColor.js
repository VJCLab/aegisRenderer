/**
 * Aegisub (&HAABBGGRR) → CSS Hex/RGBA 변환
 * @param {string} aegisubColor - 예: "&H006E6E72"
 * @returns {{ hex: string, rgba: string }} 
 *    hex: "#RRGGBB"
 *    rgba: "rgba(r, g, b, a)"
 */
function parseAegisubColor(aegisubColor) {
    // 1) "&H" 접두사 제거, 대문자·0패딩 보장
    let hex8 = aegisubColor
        .toUpperCase()
        .replace(/^&H/, "")
        .padStart(8, "0");

    // 2) ASS 형식은 AABBGGRR
    const a = hex8.slice(0, 2);
    const b = hex8.slice(2, 4);
    const g = hex8.slice(4, 6);
    const r = hex8.slice(6, 8);

    // 3) 16진 → 10진
    const ai = parseInt(a, 16);
    const bi = parseInt(b, 16);
    const gi = parseInt(g, 16);
    const ri = parseInt(r, 16);

    // 4) CSS용 #RRGGBB, rgba()
    const hex = `#${r}${g}${b}`;
    const alpha = (ai / 255).toFixed(3).replace(/\.?0+$/, ""); // 불필요한 0 제거
    const rgba = `rgba(${ri}, ${gi}, ${bi}, ${alpha})`;

    return { hex, rgba };
}
export default parseAegisubColor;
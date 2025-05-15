/**
 * 브라우저에서 파일을 다운로드하는 함수
 * @param {string} content - 파일 내용
 * @param {string} fileName - 파일 이름
 * @param {string} contentType - 파일 타입
 */
function textSave(content, fileName, contentType = 'text/plain') {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.style.display = 'none';

    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}
async function dlHandler(convertedRawData, subOffset = 0) {
    if (!convertedRawData) return;
    const orignalFileName = convertedRawData.fileName;
    const fileName = `${orignalFileName}.ass`;
    convertedRawData.lines.forEach(line => {
        line.time = line.time + subOffset;
    });
    const { assContent, lrcData } = await lrc2ASS.convert(convertedRawData, ev => console.log(ev));
    textSave(assContent, fileName, "text/plain;charset=utf-8");

    if (lrcData) convertedRawData = lrcData;
}
export default dlHandler;
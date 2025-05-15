export default async function loadMedia(mediaElem, urlOrFile, onSetCallback = () => { }) {
    if(!mediaElem) return;
    mediaElem.src = typeof urlOrFile === "string" ? urlOrFile : URL.createObjectURL(urlOrFile);
    mediaElem.load();
    onSetCallback(mediaElem);
    return mediaElem;
}
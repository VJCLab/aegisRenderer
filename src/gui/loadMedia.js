import setMp3Poster from "./setMp3Poster.js";

function revokeBlobUrl(mediaElem, key) {
    if (mediaElem.dataset[key]) {
        URL.revokeObjectURL(mediaElem.dataset[key]);
        delete mediaElem.dataset[key];
    }
}

export default async function loadMedia(mediaElem, urlOrFile, onSetCallback = () => { }, posterPosition = "50% 1em") {
    if (!mediaElem) return;
    mediaElem.classList.remove("mp3");

    // 이전 poster, src Blob URL 해제
    revokeBlobUrl(mediaElem, "posterUrl");
    mediaElem.removeAttribute("poster");
    revokeBlobUrl(mediaElem, "srcUrl");

    // mp3 poster 처리
    await setMp3Poster(mediaElem, urlOrFile, posterPosition);

    // src 할당
    if (typeof urlOrFile === "string") {
        mediaElem.src = urlOrFile;
    } else {
        const srcUrl = URL.createObjectURL(urlOrFile);
        mediaElem.src = srcUrl;
        mediaElem.dataset.srcUrl = srcUrl;
    }
    mediaElem.load();
    onSetCallback(mediaElem);
    return mediaElem;
}
import extractMp3Tags from "./extractMp3Tags.js";

export default async function setMp3Poster(mediaElem, urlOrFile, posterPosition = "50% 1em") {
    try {
        const tag = await extractMp3Tags(urlOrFile);
        const pic = tag.tags.picture;
        if (pic) {
            const byteArray = new Uint8Array(pic.data);
            const blob = new Blob([byteArray], { type: pic.format });
            const imageUrl = URL.createObjectURL(blob);
            mediaElem.setAttribute("poster", imageUrl);

            mediaElem.dataset.posterUrl = imageUrl;
            if (posterPosition) mediaElem.style.objectPosition = posterPosition;
            mediaElem.classList.add("mp3");
            return;
        }
    } catch { }
    mediaElem.removeAttribute("poster");
    mediaElem.style.objectPosition = "";
}

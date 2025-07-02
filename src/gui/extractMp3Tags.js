/**
 * Extracts tags from an mp3 file using jsmediatags. If the given argument is a File
 * object with a type of "audio/mp3" or a name ending in ".mp3", and if window.jsmediatags
 * is defined, it will return a promise that resolves or rejects based on the result
 * of the tag extraction. Otherwise, it will immediately reject the promise.
 * @param {string|File} urlOrFile
 * @returns {Promise<Object|Error>}
 */
export default function extractMp3Tags(urlOrFile) {
    if (
        typeof window.jsmediatags !== "undefined" &&
        urlOrFile instanceof File &&
        (urlOrFile.type === "audio/mp3" || urlOrFile.name?.toLowerCase().endsWith(".mp3"))
    ) {
        return new Promise((resolve, reject) => {
            window.jsmediatags.read(urlOrFile, {
                onSuccess: resolve,
                onError: reject
            });
        });
    }
    return Promise.reject();
}
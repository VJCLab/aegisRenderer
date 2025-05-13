// parser.worker.js
import parse from './parse.js';

self.onmessage = (e) => {
    const text = e.data;
    parse(text, self.postMessage, self.postMessage);
};
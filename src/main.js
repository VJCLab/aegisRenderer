import { initPage, setupEventListeners } from './gui/page-controller.js';
await new Promise(r => window.onload = () => r());
const pageObj = await initPage();
setupEventListeners(pageObj);
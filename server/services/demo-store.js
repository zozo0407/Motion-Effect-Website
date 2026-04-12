const fs = require('fs');
const path = require('path');
const config = require('../config');

function readDemos() { return JSON.parse(fs.readFileSync(config.DATA_FILE, 'utf8')); }
function writeDemos(data) { fs.writeFileSync(config.DATA_FILE, JSON.stringify(data, null, 4), 'utf8'); }
function getNextDemoId() {
    const list = readDemos();
    let maxId = 0;
    list.forEach(d => { const num = parseInt(d.id, 10); if (!isNaN(num) && num > maxId) maxId = num; });
    return { id: String(maxId + 1).padStart(3, '0'), num: maxId + 1 };
}
function createDemoFile(fileName, html) { fs.writeFileSync(path.join(config.DEMO_DIR, fileName), html, 'utf8'); }
function readTempPreview(id) {
    const filePath = path.join(config.TEMP_PREVIEWS_DIR, `${id}.js`);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, 'utf8');
}

module.exports = { readDemos, writeDemos, getNextDemoId, createDemoFile, readTempPreview };

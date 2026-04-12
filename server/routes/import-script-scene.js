module.exports = function (app, services) {
    const fs = require('fs');
    const path = require('path');
    const { config, codeTransforms, demoStore } = services;

    app.post('/api/import-script-scene', (req, res) => {
        const body = req.body && typeof req.body === 'object' ? req.body : {};
        const title = typeof body.title === 'string' ? body.title : 'Imported ScriptScene';
        const enTitle = typeof body.enTitle === 'string' ? body.enTitle : 'Imported ScriptScene';
        const tech = typeof body.tech === 'string' ? body.tech : 'Three.js / ScriptScene';
        const keywords = typeof body.keywords === 'string' ? body.keywords : '';
        const icon = typeof body.icon === 'string' ? body.icon : '<circle cx="100" cy="100" r="50" stroke="currentColor" fill="none" />';
        const sourcePath = typeof body.sourcePath === 'string' ? body.sourcePath : '';
        const sourceContent = typeof body.sourceContent === 'string' ? body.sourceContent : '';

        const loadText = () => {
            if (sourceContent && sourceContent.trim()) return Promise.resolve(sourceContent);
            if (!codeTransforms.isPathAllowed(sourcePath)) return Promise.reject(new Error('sourcePath 不合法或不在允许目录内'));
            return fs.promises.readFile(path.resolve(sourcePath), 'utf8');
        };

        Promise.all([
            loadText(),
            fs.promises.readFile(path.join(config.ROOT_DIR, 'my-motion-portfolio/public/js/templates/scriptScene.js.txt'), 'utf8'),
            fs.promises.readFile(config.DATA_FILE, 'utf8')
        ]).then(([scriptText, exportTemplateText, dataText]) => {
            const { mainBlockText, ppBlockText } = codeTransforms.extractScriptSceneBlock(scriptText);
            const previewBlockText = [ppBlockText, mainBlockText].filter(Boolean).join('\n\n').trim();
            const exportBlockText = (mainBlockText && mainBlockText.trim()) ? mainBlockText.trim() : previewBlockText;
            const exportText = codeTransforms.toExportTemplate(exportTemplateText, exportBlockText);
            const exportTextLiteral = JSON.stringify(exportText);

            const list = JSON.parse(dataText);
            let maxId = 0;
            list.forEach(d => {
                const num = parseInt(d.id, 10);
                if (!isNaN(num) && num > maxId) maxId = num;
            });
            const newId = String(maxId + 1).padStart(3, '0');
            const fileName = `demo${maxId + 1}.html`;
            const filePath = path.join(config.DEMO_DIR, fileName);

            const threePath = '../js/libs/three/three.module.js';
            const threeAddonsPath = '../js/libs/three/addons/';
            const html = codeTransforms.buildScriptSceneDemoHtml({ title, threePath, threeAddonsPath, blockText: previewBlockText, exportTextLiteral });

            const newDemo = {
                id: newId,
                title,
                keywords,
                enTitle,
                tech,
                url: `my-motion-portfolio/public/demos/${fileName}`,
                color: 'text-gray-400',
                isOriginal: true,
                icon
            };

            return fs.promises.writeFile(filePath, html, 'utf8')
                .then(() => {
                    list.unshift(newDemo);
                    return fs.promises.writeFile(config.DATA_FILE, JSON.stringify(list, null, 4), 'utf8');
                })
                .then(() => res.json({ success: true, demo: newDemo }));
        }).catch(err => {
            res.status(400).json({ error: err && err.message ? err.message : String(err) });
        });
    });
};

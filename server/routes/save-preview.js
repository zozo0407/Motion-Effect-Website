module.exports = function (app, services) {
    const fs = require('fs');
    const path = require('path');
    const { config, demoStore } = services;

    app.post('/api/save-preview-as-demo', (req, res) => {
        const { id, title, enTitle, tech, keywords, icon } = req.body;

        if (!id) return res.status(400).json({ error: 'Missing preview ID' });

        const tempPath = path.join(config.TEMP_PREVIEWS_DIR, `${id}.js`);
        if (!fs.existsSync(tempPath)) {
            return res.status(404).json({ error: 'Preview code not found' });
        }

        const sourceContent = fs.readFileSync(tempPath, 'utf8');

        fs.readFile(config.DATA_FILE, 'utf8', (err, data) => {
            if (err) return res.status(500).json({ error: 'Read error' });

            const list = JSON.parse(data);
            let maxId = 0;
            list.forEach(d => {
                const num = parseInt(d.id, 10);
                if (!isNaN(num) && num > maxId) maxId = num;
            });

            const newId = String(maxId + 1).padStart(3, '0');
            const fileName = `demo${maxId + 1}.html`;
            const filePath = path.join(config.DEMO_DIR, fileName);

            const safeCode = sourceContent.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/<\//g, '<\\/');

            const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title || 'AI Generated'}</title>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #111; overflow: hidden; }
        #canvas-container { width: 100%; height: 100%; }
    </style>
    <script type="importmap">
    {
        "imports": {
            "three": "https://unpkg.com/three@0.160.0/build/three.module.js",
            "three/addons/": "https://unpkg.com/three@0.160.0/examples/jsm/"
        }
    }
    </script>
</head>
<body>
    <div id="canvas-container"></div>
    <script type="module">
        const codeSource = \`${safeCode}\`;

        async function init() {
            try {
                const blob = new Blob([codeSource], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                const mod = await import(url);
                URL.revokeObjectURL(url);

                const EngineEffect = mod.default || mod.EngineEffect;
                if (!EngineEffect) return;

                const effect = new EngineEffect();
                const container = document.getElementById('canvas-container');
                const canvas = document.createElement('canvas');
                canvas.style.width = '100%';
                canvas.style.height = '100%';
                canvas.style.display = 'block';
                container.appendChild(canvas);

                const getSize = () => ({
                    width: window.innerWidth,
                    height: window.innerHeight,
                    dpr: Math.min(2, window.devicePixelRatio || 1)
                });

                effect.onStart({ container, canvas, gl: null, size: getSize() });

                window.addEventListener('resize', () => {
                    const size = getSize();
                    canvas.width = size.width * size.dpr;
                    canvas.height = size.height * size.dpr;
                    if (effect.onResize) effect.onResize(size);
                });

                let lastTime = performance.now();
                const frame = (now) => {
                    const time = now / 1000;
                    const deltaTime = Math.max(0, (now - lastTime) / 1000);
                    lastTime = now;
                    if (effect.onUpdate) effect.onUpdate({ time, deltaTime, size: getSize() });
                    requestAnimationFrame(frame);
                };
                requestAnimationFrame(frame);

                window.addEventListener('message', (e) => {
                    if(e.data.type === 'HANDSHAKE') {
                        const config = effect.getUIConfig ? effect.getUIConfig() : [];
                        window.parent.postMessage({ type: 'UI_CONFIG', config }, '*');
                    } else if (e.data.type === 'UPDATE_PARAM' && effect.setParam) {
                        effect.setParam(e.data.key, e.data.value);
                    }
                });

            } catch (e) {
                console.error(e);
            }
        }
        init();
    </script>
</body>
</html>`;

            fs.writeFile(filePath, html, (err) => {
                if (err) return res.status(500).json({ error: 'Write file error' });

                const newDemo = {
                    id: newId,
                    title: title || 'AI Generated Effect',
                    keywords: keywords || 'ai, generated',
                    enTitle: enTitle || 'AI Generated Effect',
                    tech: tech || 'Three.js / AI',
                    url: `my-motion-portfolio/public/demos/${fileName}`,
                    color: 'text-gray-400',
                    isOriginal: true,
                    icon: icon || '<circle cx="100" cy="100" r="50" stroke="currentColor" fill="none" />'
                };

                list.unshift(newDemo);

                fs.writeFile(config.DATA_FILE, JSON.stringify(list, null, 4), (err) => {
                    if (err) return res.status(500).json({ error: 'Update JSON error' });
                    res.json({ success: true, demo: newDemo });
                });
            });
        });
    });
};

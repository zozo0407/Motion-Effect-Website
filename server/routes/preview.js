module.exports = function (app, services) {
    const fs = require('fs');
    const path = require('path');
    const { config } = services;

    app.get('/preview/:id', (req, res) => {
        const id = req.params.id;
        const filePath = path.join(config.TEMP_PREVIEWS_DIR, `${id}.js`);

        if (!fs.existsSync(filePath)) {
            return res.status(404).send('Preview not found or expired.');
        }

        const code = fs.readFileSync(filePath, 'utf8');
        const safeCode = code.replace(/`/g, '\\`').replace(/\$/g, '\\$').replace(/<\//g, '<\\/');

        const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quick Preview</title>
    <style>
        body, html { margin: 0; padding: 0; width: 100%; height: 100%; background: #111; overflow: hidden; }
        #canvas-container { width: 100%; height: 100%; }
        #error-overlay { position: fixed; top: 0; left: 0; width: 100%; padding: 20px; background: rgba(255,0,0,0.8); color: white; display: none; z-index: 9999; font-family: monospace; white-space: pre-wrap;}
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
    <div id="error-overlay"></div>
    <div id="canvas-container"></div>
    <script type="module">
        const codeSource = \`${safeCode}\`;

        function showError(e) {
            const errDiv = document.getElementById('error-overlay');
            errDiv.textContent = e.message || String(e);
            errDiv.style.display = 'block';
            console.error(e);
        }

        async function init() {
            try {
                const blob = new Blob([codeSource], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                const mod = await import(url);
                URL.revokeObjectURL(url);

                const EngineEffect = mod.default || mod.EngineEffect;
                if (!EngineEffect) throw new Error('Cannot find default class EngineEffect');

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

                effect.onStart({
                    container,
                    canvas,
                    gl: null,
                    size: getSize()
                });

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
            } catch (e) {
                showError(e);
            }
        }
        init();
    </script>
</body>
</html>`;

        res.send(html);
    });
};

module.exports = function (app, services) {
    const fs = require('fs');
    const path = require('path');
    const { config } = services;

    app.post('/api/create-demo', (req, res) => {
        const { title, enTitle, tech, keywords, icon } = req.body;

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

            const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { margin: 0; overflow: hidden; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; font-family: monospace; }
        .placeholder { text-align: center; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
    </style>
</head>
<body>
    <div class="placeholder">
        <h1>${title}</h1>
        <p>AWAITING AI GENERATION...</p>
        <p class="tech">[ ${tech} ]</p>
    </div>
    <script>
        window.addEventListener('message', (e) => {
            if(e.data.type === 'HANDSHAKE') {
                window.parent.postMessage({
                    type: 'UI_CONFIG',
                    config: []
                }, '*');
            }
        });
    </script>
</body>
</html>`;

            fs.writeFile(filePath, template, (err) => {
                if (err) return res.status(500).json({ error: 'Write file error' });

                const newDemo = {
                    id: newId,
                    title,
                    keywords: keywords || '',
                    enTitle,
                    tech,
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

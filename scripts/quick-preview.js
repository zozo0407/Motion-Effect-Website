const fs = require('fs');
const path = require('path');

// Simple arg parser
const args = process.argv.slice(2);
let prompt = '';
let save = false;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '--prompt' && args[i + 1]) {
        prompt = args[i + 1];
        i++;
    } else if (args[i] === '--save') {
        save = true;
    } else if (!prompt && !args[i].startsWith('--')) {
        prompt = args[i];
    }
}

if (!prompt) {
    console.error('Usage: node scripts/quick-preview.js --prompt "your effect description" [--save]');
    process.exit(1);
}

const SERVER_URL = 'http://localhost:3000';
const TEMP_DIR = path.join(__dirname, '../.temp_previews');

async function checkServer() {
    try {
        const demosRes = await fetch(`${SERVER_URL}/api/demos`);
        if (!demosRes.ok) {
            return {
                ok: false,
                message: `\n❌ Error: Server responded ${demosRes.status} at ${SERVER_URL}/api/demos\nPlease start the server first by running: npm run creator\n`
            };
        }

        const previewRes = await fetch(`${SERVER_URL}/preview/__healthcheck__`);
        const previewText = await previewRes.text();
        const hasPreviewRoute =
            (previewRes.status === 404 && previewText.includes('Preview not found or expired.')) ||
            (previewRes.status >= 200 && previewRes.status < 300);

        if (!hasPreviewRoute && previewText.includes('Cannot GET /preview/')) {
            return {
                ok: false,
                message: `\n❌ Error: Server is reachable but /preview route is missing.\nPlease restart the server (stop the old process and run: node server.js).\n`
            };
        }

        return { ok: true };
    } catch (e) {
        return {
            ok: false,
                message: `\n❌ Error: Cannot connect to ${SERVER_URL}\nPlease start the server first by running: npm run creator\n`
        };
    }
}

async function run() {
    const status = await checkServer();
    if (!status.ok) {
        console.error(status.message);
        process.exit(1);
    }

    console.log(`\n🚀 Sending request to generate effect (v2 pipeline)...`);
    console.log(`Prompt: "${prompt}"`);
    console.log(`Please wait, this usually takes 30-60 seconds...\n`);

    const startTime = Date.now();

    try {
        const response = await fetch(`${SERVER_URL}/api/generate-effect?v=2`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Server returned ${response.status}: ${err}`);
        }

        const data = await response.json();
        const code = data.code;

        if (!code) {
            throw new Error('No code returned from server.');
        }

        const timeTaken = ((Date.now() - startTime) / 1000).toFixed(1);
        console.log(`✅ Generation complete in ${timeTaken}s!`);

        // Save to temp
        if (!fs.existsSync(TEMP_DIR)) {
            fs.mkdirSync(TEMP_DIR, { recursive: true });
        }

        const id = Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        fs.writeFileSync(path.join(TEMP_DIR, `${id}.js`), code, 'utf8');

        console.log(`\n✨ ======================================= ✨`);
        console.log(`   Preview URL: ${SERVER_URL}/preview/${id}`);
        console.log(`✨ ======================================= ✨\n`);
        console.log(`(Cmd/Ctrl + Click the link to open in browser)`);

        if (save) {
            console.log(`\n💾 Saving as permanent demo...`);
            const saveRes = await fetch(`${SERVER_URL}/api/save-preview-as-demo`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id,
                    title: prompt.slice(0, 20) + (prompt.length > 20 ? '...' : ''),
                    tech: 'AI Generated (v2)',
                    keywords: 'ai, generated'
                })
            });

            if (saveRes.ok) {
                console.log(`✅ Successfully saved to demos! It will now appear on the homepage.`);
            } else {
                console.error(`❌ Failed to save demo:`, await saveRes.text());
            }
        }

    } catch (e) {
        console.error('\n❌ Generation failed:');
        console.error(e.message || e);
        process.exit(1);
    }
}

run();

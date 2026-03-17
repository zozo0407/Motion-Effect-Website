const express = require('express');

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number.parseInt(process.env.OPENAI_STUB_PORT || process.env.STUB_PORT || '5055', 10);

function buildScriptSceneCode(prompt) {
    const safePrompt = typeof prompt === 'string' ? prompt.trim() : '';
    const title = safePrompt ? safePrompt.replace(/[`$\\]/g, '').slice(0, 80) : 'AI Effect';

    return `import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class ScriptScene {
    constructor(container) {
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050510, 0.12);

        this.camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 100);
        this.camera.position.set(0, 1.2, 6);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;
        this.container.appendChild(this.renderer.domElement);

        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.enablePan = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 12;

        this.scene.add(new THREE.AmbientLight(0xffffff, 0.25));
        const key = new THREE.DirectionalLight(0x9ad7ff, 1.2);
        key.position.set(3, 5, 2);
        this.scene.add(key);

        const rim = new THREE.PointLight(0xff4fd8, 2.0, 20);
        rim.position.set(-3, 2, -2);
        this.scene.add(rim);

        const group = new THREE.Group();
        this.scene.add(group);

        const coreGeo = new THREE.IcosahedronGeometry(1.15, 3);
        const coreMat = new THREE.MeshStandardMaterial({
            color: 0x66f6ff,
            emissive: 0x0a2a33,
            roughness: 0.25,
            metalness: 0.75
        });
        this.core = new THREE.Mesh(coreGeo, coreMat);
        group.add(this.core);

        const wire = new THREE.LineSegments(
            new THREE.WireframeGeometry(coreGeo),
            new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.18 })
        );
        group.add(wire);

        const starCount = 1800;
        const starsGeo = new THREE.BufferGeometry();
        const pos = new Float32Array(starCount * 3);
        for (let i = 0; i < starCount; i++) {
            const r = 10 + Math.random() * 25;
            const a = Math.random() * Math.PI * 2;
            const b = (Math.random() - 0.5) * Math.PI;
            pos[i * 3 + 0] = Math.cos(a) * Math.cos(b) * r;
            pos[i * 3 + 1] = Math.sin(b) * r;
            pos[i * 3 + 2] = Math.sin(a) * Math.cos(b) * r;
        }
        starsGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        const starsMat = new THREE.PointsMaterial({ size: 0.018, color: 0xffffff, transparent: true, opacity: 0.85 });
        this.stars = new THREE.Points(starsGeo, starsMat);
        this.scene.add(this.stars);

        this.label = document.createElement('div');
        this.label.textContent = ${JSON.stringify(title)};
        this.label.style.position = 'fixed';
        this.label.style.left = '16px';
        this.label.style.top = '16px';
        this.label.style.fontFamily = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';
        this.label.style.fontSize = '12px';
        this.label.style.letterSpacing = '0.04em';
        this.label.style.color = 'rgba(255,255,255,0.8)';
        this.label.style.pointerEvents = 'none';
        document.body.appendChild(this.label);

        this.onResize = this.onResize.bind(this);
        window.addEventListener('resize', this.onResize);

        this.animate = this.animate.bind(this);
        this.clock = new THREE.Clock();
        this.animate();
    }

    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        if (!this.renderer) return;
        requestAnimationFrame(this.animate);
        const t = this.clock.getElapsedTime();

        this.controls.update();

        this.core.rotation.x = t * 0.25;
        this.core.rotation.y = t * 0.35;
        this.core.scale.setScalar(1 + Math.sin(t * 1.6) * 0.03);

        this.stars.rotation.y = t * 0.015;

        this.renderer.render(this.scene, this.camera);
    }

    destroy() {
        window.removeEventListener('resize', this.onResize);
        if (this.label && this.label.parentNode) this.label.parentNode.removeChild(this.label);
        if (this.controls) this.controls.dispose();
        if (this.renderer) {
            this.renderer.dispose();
            if (this.renderer.domElement && this.renderer.domElement.parentNode) {
                this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
            }
        }
    }
}

export default ScriptScene;
`;
}

function extractUserPrompt(body) {
    const messages = body && Array.isArray(body.messages) ? body.messages : [];
    const lastUser = [...messages].reverse().find(m => m && m.role === 'user' && typeof m.content === 'string');
    return lastUser ? lastUser.content : '';
}

function chatCompletionsHandler(req, res) {
    const auth = req.headers.authorization || '';
    if (!/^Bearer\s+\S+/.test(auth)) {
        return res.status(401).json({ error: { message: 'Missing or invalid Authorization header' } });
    }

    const prompt = extractUserPrompt(req.body);
    const code = buildScriptSceneCode(prompt);

    res.json({
        id: `chatcmpl_stub_${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: (req.body && req.body.model) || 'stub-model',
        choices: [
            {
                index: 0,
                message: { role: 'assistant', content: code },
                finish_reason: 'stop'
            }
        ]
    });
}

app.post('/v1/chat/completions', chatCompletionsHandler);
app.post('/chat/completions', chatCompletionsHandler);

app.get('/healthz', (req, res) => {
    res.json({ ok: true });
});

app.listen(PORT, () => {
    console.log(`OpenAI stub listening at http://127.0.0.1:${PORT}/v1/chat/completions`);
});

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const config = require('./config');
require('dotenv').config();

const aiProvider = require('./services/ai-provider');
const aiGenerator = require('./services/ai-generator');
const codeValidator = require('./services/code-validator');
const codeAutofix = require('./services/code-autofix');
const codeTransforms = require('./services/code-transforms');
const skeletonRouter = require('./services/skeleton-router');
const demoStore = require('./services/demo-store');

const services = { aiProvider, aiGenerator, codeValidator, codeAutofix, codeTransforms, skeletonRouter, demoStore, config };

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.get('/favicon.ico', (req, res) => res.status(204).end());
app.use(express.static(config.ROOT_DIR));

require('./routes/generate')(app, services);
require('./routes/generate-v2')(app, services);
require('./routes/intent')(app, services);
require('./routes/demos')(app, services);
require('./routes/import-script-scene')(app, services);
require('./routes/save-preview')(app, services);
require('./routes/create-demo')(app, services);
require('./routes/preview')(app, services);

app.listen(config.PORT, () => { console.log(`Creator Server running at http://localhost:${config.PORT}`); });

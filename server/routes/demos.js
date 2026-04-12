module.exports = function (app, services) {
    const fs = require('fs');
    const { config } = services;

    app.get('/api/demos', (req, res) => {
        fs.readFile(config.DATA_FILE, 'utf8', (err, data) => {
            if (err) {
                console.error('Error reading demos:', err);
                return res.status(500).json({ error: 'Failed to read data' });
            }
            res.json(JSON.parse(data));
        });
    });

    app.post('/api/demos', (req, res) => {
        const newData = req.body;
        fs.writeFile(config.DATA_FILE, JSON.stringify(newData, null, 4), (err) => {
            if (err) {
                console.error('Error writing demos:', err);
                return res.status(500).json({ error: 'Failed to save data' });
            }
            res.json({ success: true });
        });
    });
};

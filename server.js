const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/lessons', (req, res) => {
  const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'lessons.json'), 'utf8'));
  res.json(data);
});

app.post('/api/lessons', (req, res) => {
  fs.writeFileSync(path.join(__dirname, 'lessons.json'), JSON.stringify(req.body, null, 2));
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Math Sidekick running on http://localhost:${PORT}`));

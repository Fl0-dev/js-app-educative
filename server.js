// server.js
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Sert les fichiers statiques (index.html, style.css, script.js) depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

app.listen(port, () => {
    console.log(`Application éducative lancée sur http://localhost:${port}`);
});
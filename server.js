// server.js
const express = require('express');
const path = require('path');
const app = express();
const port = 3000;

// Autoriser les JSON bodies pour l'API
app.use(express.json());

// Sert les fichiers statiques (index.html, style.css, script.js) depuis le dossier 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Router API (auth, résultats)
try {
    const apiRouter = require('./server/api-users');
    app.use('/api', apiRouter);
} catch (e) {
    console.warn('Router API non chargé :', e.message);
}

app.listen(port, () => {
    console.log(`Application éducative lancée sur http://localhost:${port}`);
});
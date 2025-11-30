import { store } from './store.js';
import { initJSConfettiIfAvailable } from './utils.js';
import { renderMenuMatieres, deselectMatiere, afficherSection } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Chargement des matières : nouvelle méthode (index + fichiers par matière).
    // Si l'index ou les fichiers individuels échouent, on retombe en arrière vers l'ancien fichier `data/matieres.json`.
    fetch('data/matieres/index.json')
        .then(response => {
            if (!response.ok) throw new Error('Index des matières introuvable');
            return response.json();
        })
        .then(index => {
            // index est un tableau d'objets { name, file }
            const fetches = index.map(entry => fetch('data/' + entry.file)
                .then(r => { if (!r.ok) throw new Error('Impossible de charger ' + entry.file); return r.json(); })
                .then(data => ({ name: entry.name, data }))
            );
            return Promise.all(fetches);
        })
        .then(arr => {
            const assembled = {};
            arr.forEach(item => { assembled[item.name] = item.data; });
            store.appData = assembled;
            renderMenuMatieres();
        })
        .catch(() => {
            // Fallback : charger l'ancien fichier monolithique
            return fetch('data/matieres.json')
                .then(response => {
                    if (!response.ok) throw new Error('Erreur lors du chargement de data/matieres.json');
                    return response.json();
                })
                .then(data => {
                    store.appData = data;
                    renderMenuMatieres();
                });
        })
        .then(() => {

            const heroTitle = document.getElementById('hero-title');
            if (heroTitle) heroTitle.addEventListener('click', deselectMatiere);

            initJSConfettiIfAvailable();

            // Exposer la fonction d'affichage pour les handlers inline dans HTML
            window.afficherSection = afficherSection;

            // Ajuster la variable CSS --header-height
            function updateHeaderHeightVar() {
                const header = document.querySelector('header.hero');
                const h = header ? header.offsetHeight : 140;
                document.documentElement.style.setProperty('--header-height', h + 'px');
            }

            updateHeaderHeightVar();
            let _resizeTimer = null;
            window.addEventListener('resize', () => {
                clearTimeout(_resizeTimer);
                _resizeTimer = setTimeout(updateHeaderHeightVar, 120);
            });
        })
        .catch(err => {
            const menu = document.getElementById('menu-matieres');
            if (menu) menu.innerHTML = '<li><div class="notification is-danger">Impossible de charger les matières.</div></li>';
            console.error(err);
        });
});

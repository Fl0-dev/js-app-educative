import { store } from './store.js';
import { initJSConfettiIfAvailable } from './utils.js';
import { renderMenuMatieres, deselectMatiere, afficherSection } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    fetch('data/matieres.json')
        .then(response => {
            if (!response.ok) throw new Error('Erreur lors du chargement de data/matieres.json');
            return response.json();
        })
        .then(data => {
            store.appData = data;
            renderMenuMatieres();

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

import { store } from './store.js';
import { initJSConfetti } from './utils.js';
import { renderSubjectMenu, deselectSubject, showSection, toggleMobileSubjects, closeMobileSubjects } from './ui.js';
import { initAuthUI } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await loadAppData();
    } catch (err) {
        const menu = document.getElementById('menu-matieres');
        if (menu) menu.innerHTML = '<li><div class="notification is-danger">Impossible de charger les matières.</div></li>';
        console.error(err);
        return;
    }

    const heroTitle = document.getElementById('hero-title');
    if (heroTitle) heroTitle.addEventListener('click', deselectSubject);

    initJSConfetti();

    // Initialiser l'UI d'authentification (login/register)
    try { initAuthUI(); } catch (e) { console.warn('Auth UI init failed', e); }

    // Exposer la fonction d'affichage pour les handlers inline dans HTML
    window.showSection = showSection;

    // Lier le bouton dropdown mobile et l'overlay
    const mobileBtn = document.getElementById('mobile-matieres-btn');
    const mobileOverlay = document.getElementById('mobile-matieres-overlay');
    if (mobileBtn) mobileBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMobileSubjects(); });
    if (mobileOverlay) mobileOverlay.addEventListener('click', () => { closeMobileSubjects(); });

    // Fermer le dropdown si l'utilisateur clique ailleurs (au cas où overlay n'est pas utilisé)
    document.addEventListener('click', (e) => {
        const dd = document.getElementById('mobile-matieres-dropdown');
        const btn = document.getElementById('mobile-matieres-btn');
        if (!dd || !btn) return;
        if (!dd.contains(e.target) && !btn.contains(e.target)) {
            closeMobileSubjects();
        }
    });

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
});

// Chargement des matières : nouvelle méthode (index + fichiers par matière).
// Si l'index ou les fichiers individuels échouent, on retombe en arrière vers l'ancien fichier `data/matieres.json`.
async function loadAppData() {
    try {
        const indexRes = await fetch('data/matieres/index.json');
        if (!indexRes.ok) throw new Error('Index des matières introuvable');
        const index = await indexRes.json();

        // index est un tableau d'objets { name, file, emoji }
        const entries = await Promise.all(index.map(async entry => {
            const r = await fetch('data/' + entry.file);
            if (!r.ok) throw new Error('Impossible de charger ' + entry.file);
            const data = await r.json();
            return { name: entry.name, data, emoji: entry.emoji };
        }));

        const assembled = {};
        entries.forEach(item => {
            assembled[item.name] = Object.assign({}, item.data, (item.emoji ? { emoji: item.emoji } : {}));
        });
        store.appData = assembled;
    } catch {
        // Fallback : charger l'ancien fichier monolithique
        const fallbackRes = await fetch('data/matieres.json');
        if (!fallbackRes.ok) throw new Error('Erreur lors du chargement de data/matieres.json');
        store.appData = await fallbackRes.json();
    }

    renderSubjectMenu();
}

import { store } from './store.js';

export function parseContentMarkup(text) {
    if (!text) return '';
    const withBold = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return withBold.replace(/\n/g, '<br>');
}

export function updateMascotImage(filename) {
    const img = document.getElementById('mascotte-img');
    if (!img) return;
    img.src = `data/mascotte/${filename}`;
}

export function getEmojiForSubject(subject) {
    // Normalise le nom (supprime accents, espaces, tirets, et met en minuscule)
    function normalizeName(s) {
        if (!s) return '';
        return s
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/[^a-z0-9]/gi, '')
            .toLowerCase();
    }

    const norm = normalizeName(subject);

    // Si l'objet de matière contient une propriété `emoji`, l'utiliser.
    try {
        if (store && store.appData) {
            // Tentative de correspondance exacte
            if (store.appData[subject] && store.appData[subject].emoji) return store.appData[subject].emoji;

            // Cherche une clé normalisée dans appData
            for (const key of Object.keys(store.appData)) {
                if (normalizeName(key) === norm) {
                    if (store.appData[key] && store.appData[key].emoji) return store.appData[key].emoji;
                    break;
                }
            }
        }
    } catch (e) {
        // noop
    }

    // Plus de fallback statique : retourner chaîne vide si aucun emoji n'est trouvé.
    return '';
}

export function initJSConfetti() {
    try {
        if (typeof JSConfetti !== 'undefined') {
            store.jsConfetti = new JSConfetti();
        }
    } catch (e) {
        console.warn('JSConfetti non initialisé :', e);
        store.jsConfetti = null;
    }
}

export function formatFrenchDate(iso) {
    try {
        const d = new Date(iso);
        if (isNaN(d)) return iso;
        const day = d.getDate();
        const month = d.toLocaleString('fr-FR', { month: 'long' });
        const monthCap = month.charAt(0).toUpperCase() + month.slice(1);
        const year = d.getFullYear();
        const hh = String(d.getHours()).padStart(2, '0');
        const mm = String(d.getMinutes()).padStart(2, '0');
        return `${day} ${monthCap} ${year} à ${hh}h${mm}`;
    } catch (e) {
        return iso;
    }
}

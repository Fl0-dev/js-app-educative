import { store } from './store.js';

export function parseContentMarkup(text) {
    if (!text) return '';
    const withBold = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return withBold.replace(/\n/g, '<br>');
}

export function updateMascotteImage(filename) {
    const img = document.getElementById('mascotte-img');
    if (!img) return;
    img.src = `data/mascotte/${filename}`;
}

export function getEmojiForMatiere(matiere) {
    const map = {
        'Maths': '🔢',
        'Français': '🥖',
        'Anglais': '💂',
        'Histoire': '📜',
        'Géographie': '🌍',
        'SVT': '🌱',
        'Physique-Chimie': '⚗️',
        'Technologie': '🛠️',
        'Espagnol': '🌮',
        'Informatique': '💻'
    };
    return map[matiere] || '';
}

export function initJSConfettiIfAvailable() {
    try {
        if (typeof JSConfetti !== 'undefined') {
            store.jsConfetti = new JSConfetti();
        }
    } catch (e) {
        console.warn('JSConfetti non initialisé :', e);
        store.jsConfetti = null;
    }
}

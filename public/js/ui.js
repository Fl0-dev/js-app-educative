import { store } from './store.js';
import { parseContentMarkup, getEmojiForMatiere, updateMascotteImage } from './utils.js';
import { demarrerQuiz } from './quiz.js';

export function renderMenuMatieres() {
    const menu = document.getElementById('menu-matieres');
    menu.innerHTML = '';

    Object.keys(store.appData).forEach((matiere) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.className = 'button is-custom is-light is-fullwidth mb-2';
        btn.textContent = `${getEmojiForMatiere(matiere)} ${matiere}`;
        btn.setAttribute('data-matiere', matiere);
        btn.addEventListener('click', () => chargerMatiere(matiere));

        li.appendChild(btn);
        menu.appendChild(li);
    });
}

// Affiche des boutons pour choisir la taille du quiz (5 / 10 / 20)
export function renderQuizSizeOptions(matiere) {
    const quizContainer = document.getElementById('quiz-container');
    if (!quizContainer) return;
    quizContainer.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'box has-text-centered';
    wrap.innerHTML = `<p class="subtitle">Choisissez la taille du quiz pour <strong>${matiere}</strong> :</p>`;

    const sizes = [5, 10, 20];
    const btnGroup = document.createElement('div');
    btnGroup.className = 'buttons is-centered';

    sizes.forEach(n => {
        const b = document.createElement('button');
        b.className = 'button is-custom';
        b.textContent = `${n} questions`;
        b.addEventListener('click', () => demarrerQuiz(matiere, n));
        btnGroup.appendChild(b);
    });

    wrap.appendChild(btnGroup);
    quizContainer.appendChild(wrap);
}

export function afficherSection(sectionId) {
    document.getElementById('section-cours').classList.add('is-hidden');
    document.getElementById('section-quiz').classList.add('is-hidden');
    document.getElementById('section-' + sectionId).classList.remove('is-hidden');

    document.getElementById('li-btn-cours').classList.remove('is-active');
    document.getElementById('li-btn-quiz').classList.remove('is-active');
    document.getElementById('li-btn-' + sectionId).classList.add('is-active');

    if (sectionId === 'quiz') {
        const quizNotif = document.querySelector('#section-quiz .notification');
        const quizContainer = document.getElementById('quiz-container');
        if (!store.currentMatiere) {
            if (quizNotif) quizNotif.style.display = '';
            if (quizContainer) quizContainer.innerHTML = '';
            return;
        }
        if (quizNotif) quizNotif.style.display = 'none';
        // Proposer le choix du nombre de questions avant de démarrer
        renderQuizSizeOptions(store.currentMatiere);
        return;
    }

    if (sectionId === 'cours') {
        if (store.currentMatiere) {
            afficherCours(store.currentMatiere);
        }
    }
}

export function chargerMatiere(matiere) {
    store.currentMatiere = matiere;
    const titre = document.getElementById('titre-matiere');
    if (titre) titre.textContent = matiere;

    const liQuiz = document.getElementById('li-btn-quiz');
    const isQuizActive = liQuiz && liQuiz.classList.contains('is-active');

    if (isQuizActive) {
        const quizNotif = document.querySelector('#section-quiz .notification');
        if (quizNotif) quizNotif.style.display = 'none';
        afficherSection('quiz');
        renderQuizSizeOptions(matiere);
    } else {
        afficherCours(matiere);
        afficherSection('cours');
    }

    const buttons = document.querySelectorAll('#menu-matieres button');
    buttons.forEach(btn => {
        btn.classList.remove('is-active');
        // garantir que tous les boutons ont la classe `is-custom is-light` quand inactifs
        if (!btn.classList.contains('is-custom')) btn.classList.add('is-custom');
        if (!btn.classList.contains('is-light')) btn.classList.add('is-light');
        // retirer d'anciennes classes Bulma si présentes
        btn.classList.remove('is-link');
    });

    const activeBtn = document.querySelector(`button[data-matiere="${matiere}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('is-light');
        if (!activeBtn.classList.contains('is-custom')) activeBtn.classList.add('is-custom');
        activeBtn.classList.add('is-active');
        activeBtn.classList.remove('is-link');
    }
}

export function deselectMatiere() {
    store.currentMatiere = null;
    const titre = document.getElementById('titre-matiere');
    if (titre) titre.textContent = 'Bienvenue ! Choisissez une matière.';
    updateMascotteImage('welcome.png');

    const coursSection = document.getElementById('section-cours');
    if (coursSection) {
        coursSection.innerHTML = `<div class="notification is-info is-light">Sélectionnez une matière dans le menu pour afficher les notions de niveau 5ème.</div>`;
    }

    const quizSection = document.getElementById('section-quiz');
    const quizContainer = document.getElementById('quiz-container');
    if (quizSection) quizSection.classList.add('is-hidden');
    if (quizContainer) quizContainer.innerHTML = '';

    const buttons = document.querySelectorAll('#menu-matieres button');
    buttons.forEach(btn => {
        btn.classList.remove('is-active');
        if (!btn.classList.contains('is-custom')) btn.classList.add('is-custom');
        if (!btn.classList.contains('is-light')) btn.classList.add('is-light');
        btn.classList.remove('is-link');
    });

    const liCours = document.getElementById('li-btn-cours');
    const liQuiz = document.getElementById('li-btn-quiz');
    if (liCours) liCours.classList.remove('is-active');
    if (liQuiz) liQuiz.classList.remove('is-active');
}

export function afficherCours(matiere) {
    const coursData = (store.appData[matiere] && store.appData[matiere].notions) || [];
    const coursContainer = document.getElementById('section-cours');
    coursContainer.innerHTML = '';

    const shuffled = coursData.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    shuffled.forEach(notion => {
        const notionCard = document.createElement('div');
        notionCard.className = 'notion-card box block';
        const contenuHTML = parseContentMarkup(notion.contenu);
        notionCard.innerHTML = `
            <h3 class="title is-4">${notion.titre}</h3>
            <p>${contenuHTML}</p>
        `;
        coursContainer.appendChild(notionCard);
    });
}

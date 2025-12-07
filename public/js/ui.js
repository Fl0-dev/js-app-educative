import { store } from './store.js';
import { parseContentMarkup, getEmojiForSubject, updateMascotImage } from './utils.js';
import { startQuiz } from './quiz.js';
// État du dropdown mobile
let _mobileSubjectsOpen = false;

export function isMobileSubjectsOpen() { return _mobileSubjectsOpen; }

export function openMobileSubjects() {
    const dd = document.getElementById('mobile-matieres-dropdown');
    const overlay = document.getElementById('mobile-matieres-overlay');
    const btn = document.getElementById('mobile-matieres-btn');
    if (dd && overlay) {
        dd.classList.add('is-open');
        overlay.classList.add('is-active');
        if (btn) btn.setAttribute('aria-expanded', 'true');
        _mobileSubjectsOpen = true;
    }
}

export function closeMobileSubjects() {
    const dd = document.getElementById('mobile-matieres-dropdown');
    const overlay = document.getElementById('mobile-matieres-overlay');
    const btn = document.getElementById('mobile-matieres-btn');
    if (dd && overlay) {
        dd.classList.remove('is-open');
        overlay.classList.remove('is-active');
        if (btn) btn.setAttribute('aria-expanded', 'false');
        _mobileSubjectsOpen = false;
    }
}

export function toggleMobileSubjects() {
    if (_mobileSubjectsOpen) closeMobileSubjects(); else openMobileSubjects();
}

export function renderSubjectMenu() {
    const menu = document.getElementById('menu-matieres');
    if (menu) menu.innerHTML = '';

    // mobile slot
    const menuMobile = document.getElementById('menu-matieres-mobile');
    if (menuMobile) menuMobile.innerHTML = '';

    Object.keys(store.appData).forEach((subject) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.className = 'button is-custom is-light is-fullwidth mb-2';
        const emoji = (store.appData[subject] && store.appData[subject].emoji) ? store.appData[subject].emoji : getEmojiForSubject(subject);
        btn.textContent = `${emoji} ${subject}`;
        btn.setAttribute('data-matiere', subject);
        btn.addEventListener('click', () => {
            loadSubject(subject);
        });

        li.appendChild(btn);
        if (menu) menu.appendChild(li);

        if (menuMobile) {
            const li2 = document.createElement('li');
            const btn2 = btn.cloneNode(true);
            // ensure click closes dropdown after selecting
            btn2.addEventListener('click', () => {
                loadSubject(subject);
                closeMobileSubjects();
            });
            li2.appendChild(btn2);
            menuMobile.appendChild(li2);
        }
    });
}

// Affiche des boutons pour choisir la taille du quiz (5 / 10 / 20)
export function renderQuizSizeOptions(subject) {
    const quizContainer = document.getElementById('quiz-container');
    if (!quizContainer) return;
    quizContainer.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'box has-text-centered';
    wrap.innerHTML = `<p class="subtitle">Choisissez la taille du quiz pour <strong>${subject}</strong> :</p>`;

    const sizes = [5, 10, 20];
    const btnGroup = document.createElement('div');
    btnGroup.className = 'buttons is-centered';

    sizes.forEach(n => {
        const b = document.createElement('button');
        b.className = 'button is-custom';
        b.textContent = `${n} questions`;
        b.addEventListener('click', () => startQuiz(subject, n));
        btnGroup.appendChild(b);
    });

    wrap.appendChild(btnGroup);
    quizContainer.appendChild(wrap);
}

export function showSection(sectionId) {
    document.getElementById('section-cours').classList.add('is-hidden');
    document.getElementById('section-quiz').classList.add('is-hidden');
    document.getElementById('section-' + sectionId).classList.remove('is-hidden');

    document.getElementById('li-btn-cours').classList.remove('is-active');
    document.getElementById('li-btn-quiz').classList.remove('is-active');
    document.getElementById('li-btn-' + sectionId).classList.add('is-active');

    if (sectionId === 'quiz') {
        const quizNotif = document.querySelector('#section-quiz .notification');
        const quizContainer = document.getElementById('quiz-container');
        if (!store.currentSubject) {
            if (quizNotif) quizNotif.style.display = '';
            if (quizContainer) quizContainer.innerHTML = '';
            return;
        }
        if (quizNotif) quizNotif.style.display = 'none';
        // Proposer le choix du nombre de questions avant de démarrer
        renderQuizSizeOptions(store.currentSubject);
        return;
    }

    if (sectionId === 'cours') {
        if (store.currentSubject) {
            showLessons(store.currentSubject);
        }
    }
}

export function loadSubject(subject) {
    store.currentSubject = subject;
    const titre = document.getElementById('titre-matiere');
    if (titre) titre.textContent = subject;

    const liQuiz = document.getElementById('li-btn-quiz');
    const isQuizActive = liQuiz && liQuiz.classList.contains('is-active');

    if (isQuizActive) {
        const quizNotif = document.querySelector('#section-quiz .notification');
        if (quizNotif) quizNotif.style.display = 'none';
        showSection('quiz');
        renderQuizSizeOptions(subject);
    } else {
        showLessons(subject);
        showSection('cours');
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

    const activeBtn = document.querySelector(`button[data-matiere="${subject}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('is-light');
        if (!activeBtn.classList.contains('is-custom')) activeBtn.classList.add('is-custom');
        activeBtn.classList.add('is-active');
        activeBtn.classList.remove('is-link');
    }
}

export function deselectSubject() {
    store.currentSubject = null;
    const titre = document.getElementById('titre-matiere');
    if (titre) titre.textContent = 'Bienvenue ! Choisissez une matière.';
    updateMascotImage('welcome.png');

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

export function showLessons(subject) {
    const lessons = (store.appData[subject] && store.appData[subject].notions) || [];
    const coursContainer = document.getElementById('section-cours');
    coursContainer.innerHTML = '';

    const shuffled = lessons.slice();
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

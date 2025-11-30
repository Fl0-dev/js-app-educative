import { store } from './store.js';
import { parseContentMarkup, updateMascotteImage } from './utils.js';

// Quiz: demarrerQuiz, afficherQuestion, verifierReponse, showResults
export function demarrerQuiz(matiere) {
    store.currentQuestionIndex = 0;
    store.score = 0;

    const source = (store.appData[matiere] && store.appData[matiere].quiz) ? store.appData[matiere].quiz.slice() : [];
    store.currentQuizQuestions = source;
    // Fisher-Yates shuffle
    for (let i = store.currentQuizQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [store.currentQuizQuestions[i], store.currentQuizQuestions[j]] = [store.currentQuizQuestions[j], store.currentQuizQuestions[i]];
    }

    afficherQuestion(matiere, store.currentQuestionIndex);
}

export function afficherQuestion(matiere, index) {
    const quizContainer = document.getElementById('quiz-container');
    const questions = (store.currentQuizQuestions && store.currentQuizQuestions.length) ? store.currentQuizQuestions : ((store.appData[matiere] && store.appData[matiere].quiz) ? store.appData[matiere].quiz : []);
    quizContainer.innerHTML = '';

    const quizNotif = document.querySelector('#section-quiz .notification');
    if (quizNotif) quizNotif.style.display = 'none';

    updateMascotteImage('welcome.png');

    if (index >= questions.length) {
        quizContainer.innerHTML = `
            <div class="notification is-success has-text-centered">
                <h2 class="title is-4">🎉 Quiz Terminé ! 🎉</h2>
                <p class="subtitle is-5">Votre score final pour ${matiere} est : <strong>${store.score} / ${questions.length}</strong>.</p>
            </div>
        `;
        // add restart button separately so we can attach listener
        const btn = document.createElement('button');
        btn.className = 'button is-link is-large mt-3';
        btn.textContent = 'Recommencer le Quiz';
        btn.addEventListener('click', () => demarrerQuiz(matiere));
        quizContainer.querySelector('.notification').appendChild(btn);
        return;
    }

    const question = questions[index];
    const card = document.createElement('div');
    card.className = 'question-card box';

    const header = document.createElement('h3');
    header.className = 'title is-5';
    header.textContent = `Question ${index + 1} / ${questions.length}`;

    const qText = document.createElement('p');
    qText.className = 'question-text subtitle is-6';
    qText.innerHTML = parseContentMarkup(question.question);

    const optionsGroup = document.createElement('div');
    optionsGroup.className = 'options-group';

    question.options.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-button button is-light is-fullwidth mb-2';
        btn.innerHTML = parseContentMarkup(option);
        btn.addEventListener('click', () => verifierReponse(matiere, index, option, btn));
        optionsGroup.appendChild(btn);
    });

    const explicationDiv = document.createElement('div');
    explicationDiv.className = 'notification is-light mt-3';
    explicationDiv.style.display = 'none';
    explicationDiv.id = 'explication-texte';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'button is-link mt-3';
    nextBtn.style.display = 'none';
    nextBtn.textContent = (index === questions.length - 1) ? 'Voir le résultat' : 'Question suivante';
    nextBtn.addEventListener('click', () => {
        if (index === questions.length - 1) {
            showResults(matiere);
        } else {
            afficherQuestion(matiere, index + 1);
        }
    });

    card.appendChild(header);
    card.appendChild(qText);
    card.appendChild(optionsGroup);
    card.appendChild(explicationDiv);
    card.appendChild(nextBtn);

    quizContainer.appendChild(card);
}

export function verifierReponse(matiere, index, choix, boutonChoisi) {
    const question = (store.currentQuizQuestions && store.currentQuizQuestions.length) ? store.currentQuizQuestions[index] : (store.appData[matiere] && store.appData[matiere].quiz ? store.appData[matiere].quiz[index] : null);
    const card = boutonChoisi.closest('.question-card');
    const boutons = card.querySelectorAll('.option-button');
    const estCorrect = (choix === question.reponse);

    boutons.forEach(btn => btn.replaceWith(btn.cloneNode(true)));
    // re-query after replace to remove listeners
    const newBoutons = card.querySelectorAll('.option-button');

    newBoutons.forEach(btn => {
        const text = btn.textContent.trim();
        if (text === question.reponse) {
            btn.classList.remove('is-light');
            btn.classList.add('correct', 'is-success');
        } else if (btn.textContent.trim() === boutonChoisi.textContent.trim()) {
            btn.classList.remove('is-light');
            btn.classList.add('incorrect', 'is-danger');
        }
    });

    if (estCorrect) store.score++;

    const explicationDiv = card.querySelector('#explication-texte');
    if (explicationDiv) {
        explicationDiv.innerHTML = parseContentMarkup(question.explication || '');
        explicationDiv.style.display = 'block';
    }

    const nextBtn = card.querySelector('button.button.is-link');
    if (nextBtn) nextBtn.style.display = 'inline-block';

    if (estCorrect) {
        updateMascotteImage('bien.png');
        try {
            if (store.jsConfetti && typeof store.jsConfetti.addConfetti === 'function') {
                store.jsConfetti.addConfetti({
                    confettiColors: ['#ffe815ff', '#7e3cbdff']
                });
            }
        } catch (e) {
            console.warn('Erreur confetti:', e);
        }
    } else {
        updateMascotteImage('dommage.png');
    }
}

export function showResults(matiere) {
    const quizContainer = document.getElementById('quiz-container');
    const questions = (store.currentQuizQuestions && store.currentQuizQuestions.length) ? store.currentQuizQuestions : ((store.appData[matiere] && store.appData[matiere].quiz) ? store.appData[matiere].quiz : []);
    const total = questions.length;
    const pct = total > 0 ? store.score / total : 0;
    let finalImg = 'welcome.png';
    if (store.score === total && total > 0) {
        finalImg = 'parfait.png';
    } else if (pct > 0.5) {
        finalImg = 'bien.png';
    } else if (pct < 0.25) {
        finalImg = 'triste.png';
    } else {
        finalImg = 'dommage.png';
    }
    updateMascotteImage(finalImg);

    try {
        if (store.jsConfetti && typeof store.jsConfetti.addConfetti === 'function') {
            if (store.score === total && total > 0) {
                store.jsConfetti.addConfetti({
                    confettiNumber: 220,
                    confettiColors: ['#ffd700', '#ff7096', '#8ec5ff', '#7ee5b5'],
                });
                setTimeout(() => {
                    try { store.jsConfetti.addConfetti({ confettiNumber: 120, confettiColors: ['#ffd700', '#7ee5b5'] }); } catch (e) { }
                }, 350);
            } else if (pct > 0.5) {
                store.jsConfetti.addConfetti({
                    confettiNumber: 60,
                    confettiColors: ['#4CAF50', '#8ec5ff', '#ff7096']
                });
            }
        }
    } catch (e) {
        console.warn('Erreur lors du tir de confettis de résultat :', e);
    }

    quizContainer.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'notification is-success has-text-centered';
    wrap.innerHTML = `
        <h2 class="title is-4">🎉 Quiz Terminé ! 🎉</h2>
        <p class="subtitle is-5">Votre score final pour ${matiere} est : <strong>${store.score} / ${questions.length}</strong>.</p>
    `;
    const restartBtn = document.createElement('button');
    restartBtn.className = 'button is-link is-large mt-3';
    restartBtn.textContent = 'Recommencer le Quiz';
    restartBtn.addEventListener('click', () => demarrerQuiz(matiere));
    wrap.appendChild(restartBtn);
    quizContainer.appendChild(wrap);
}

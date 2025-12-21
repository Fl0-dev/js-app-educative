import { store } from './store.js';
import { parseContentMarkup, updateMascotImage } from './utils.js';
import { authHeaders, logout } from './auth.js';

// Quiz: startQuiz, showQuestion, checkAnswer, showResults
export function startQuiz(subject, size = null) {
    store.currentQuestionIndex = 0;
    store.score = 0;

    const source = (store.appData[subject] && store.appData[subject].quiz) ? store.appData[subject].quiz.slice() : [];
    store.currentQuizQuestions = source;
    // Fisher-Yates shuffle
    for (let i = store.currentQuizQuestions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [store.currentQuizQuestions[i], store.currentQuizQuestions[j]] = [store.currentQuizQuestions[j], store.currentQuizQuestions[i]];
    }

    // Si un paramètre size est fourni, tronquer la liste aux N premières questions
    if (size && Number.isInteger(size) && size > 0) {
        const n = Math.min(size, store.currentQuizQuestions.length);
        store.currentQuizQuestions = store.currentQuizQuestions.slice(0, n);
        store.lastQuizSize = n;
    } else {
        store.lastQuizSize = store.currentQuizQuestions.length;
    }

    showQuestion(subject, store.currentQuestionIndex);
}

export function showQuestion(subject, index) {
    const quizContainer = document.getElementById('quiz-container');
    const questions = (store.currentQuizQuestions && store.currentQuizQuestions.length) ? store.currentQuizQuestions : ((store.appData[subject] && store.appData[subject].quiz) ? store.appData[subject].quiz : []);
    quizContainer.innerHTML = '';

    const quizNotif = document.querySelector('#section-quiz .notification');
    if (quizNotif) quizNotif.style.display = 'none';

    updateMascotImage('welcome.png');

    if (index >= questions.length) {
        quizContainer.innerHTML = `
            <div class="notification is-primary has-text-centered">
                <h2 class="title is-4">🎉 Quiz Terminé ! 🎉</h2>
                <p class="subtitle is-5">Votre score final pour ${subject} est : <strong>${store.score} / ${questions.length}</strong>.</p>
            </div>
        `;
        // add restart button separately so we can attach listener
        const btn = document.createElement('button');
        btn.className = 'button is-custom is-large mt-3';
        btn.textContent = 'Recommencer le Quiz';
        btn.addEventListener('click', () => startQuiz(subject, store.lastQuizSize || undefined));
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

    // Mélanger les options pour les afficher dans un ordre aléatoire
    const shuffledOptions = (question.options || []).slice();
    for (let i = shuffledOptions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledOptions[i], shuffledOptions[j]] = [shuffledOptions[j], shuffledOptions[i]];
    }

    shuffledOptions.forEach(option => {
        const btn = document.createElement('button');
        btn.className = 'option-button button is-light is-fullwidth mb-2';
        btn.innerHTML = parseContentMarkup(option);
        btn.addEventListener('click', () => checkAnswer(subject, index, option, btn));
        optionsGroup.appendChild(btn);
    });

    const explanationDiv = document.createElement('div');
    explanationDiv.className = 'notification is-light mt-3';
    explanationDiv.style.display = 'none';
    explanationDiv.id = 'explication-texte';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'button is-custom mt-3';
    nextBtn.style.display = 'none';
    nextBtn.textContent = (index === questions.length - 1) ? 'Voir le résultat' : 'Question suivante';
    nextBtn.addEventListener('click', () => {
        if (index === questions.length - 1) {
            showResults(subject);
        } else {
            showQuestion(subject, index + 1);
        }
    });

    card.appendChild(header);
    card.appendChild(qText);
    card.appendChild(optionsGroup);
    card.appendChild(explanationDiv);
    card.appendChild(nextBtn);

    quizContainer.appendChild(card);
}

export function checkAnswer(subject, index, choice, chosenButton) {
    const question = (store.currentQuizQuestions && store.currentQuizQuestions.length) ? store.currentQuizQuestions[index] : (store.appData[subject] && store.appData[subject].quiz ? store.appData[subject].quiz[index] : null);
    const card = chosenButton.closest('.question-card');
    const buttons = card.querySelectorAll('.option-button');
    const isCorrect = (choice === question.reponse);

    buttons.forEach(btn => btn.replaceWith(btn.cloneNode(true)));
    // re-query after replace to remove listeners
    const newButtons = card.querySelectorAll('.option-button');

    newButtons.forEach(btn => {
        const text = btn.textContent.trim();
        if (text === question.reponse) {
            btn.classList.remove('is-light');
            btn.classList.add('correct', 'is-success');
        } else if (btn.textContent.trim() === chosenButton.textContent.trim()) {
            btn.classList.remove('is-light');
            btn.classList.add('incorrect', 'is-danger');
        }
    });

    if (isCorrect) store.score++;

    const explanationDivEl = card.querySelector('#explication-texte');
    if (explanationDivEl) {
        explanationDivEl.innerHTML = parseContentMarkup(question.explication || '');
        explanationDivEl.style.display = 'block';
    }

    const nextBtn = card.querySelector('.button.is-custom');
    if (nextBtn) nextBtn.style.display = 'inline-block';

    if (isCorrect) {
        updateMascotImage('bien.png');
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
        updateMascotImage('dommage.png');
    }
}

export function showResults(subject) {
    const quizContainer = document.getElementById('quiz-container');
    const questions = (store.currentQuizQuestions && store.currentQuizQuestions.length) ? store.currentQuizQuestions : ((store.appData[subject] && store.appData[subject].quiz) ? store.appData[subject].quiz : []);
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
    updateMascotImage(finalImg);

    // Attempt to persist the result to the server if the user is logged in
    (async function persistResult() {
        try {
            const questionsCount = questions.length;
            const headers = Object.assign({ 'Content-Type': 'application/json' }, authHeaders());
            if (!headers.Authorization) return; // not logged in

            const body = JSON.stringify({ subject, score: store.score, total: questionsCount, size: store.lastQuizSize || questionsCount });
            const resp = await fetch('/api/results', { method: 'POST', headers, body });
            if (resp.status === 401) {
                // token invalid -> logout client
                try { logout(); } catch (e) { console.warn('logout failed', e); }
                return;
            }
            if (!resp.ok) {
                const err = await resp.json().catch(() => ({}));
                console.warn('Failed to save result:', resp.status, err);
            }
        } catch (e) {
            console.warn('Error saving result:', e);
        }
    })();

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
        <p class="subtitle is-5">Votre score final pour ${subject} est : <strong>${store.score} / ${questions.length}</strong>.</p>
    `;
    const restartBtn = document.createElement('button');
    restartBtn.className = 'button is-custom is-large mt-3';
    restartBtn.textContent = 'Recommencer le Quiz';
    restartBtn.addEventListener('click', () => startQuiz(subject, store.lastQuizSize || undefined));
    wrap.appendChild(restartBtn);
    quizContainer.appendChild(wrap);
}

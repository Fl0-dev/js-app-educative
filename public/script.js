// --- 1. DONNÉES PÉDAGOGIQUES (appData) ---

// Les données ont été externalisées dans `public/data/matieres.json`.
// `appData` sera initialisé au chargement via fetch.
let appData = {};

let currentMatiere = null;
let currentQuestionIndex = 0;
let score = 0;

/**
 * Parse un texte simple: **gras** → <strong> et sauts de ligne → <br>
 * (utilisé pour cours, questions, explications)
 */
function parseContentMarkup(text) {
    if (!text) return '';
    const withBold = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    return withBold.replace(/\n/g, '<br>');
}

// JSConfetti instance (initialized after the library loads)
let jsConfetti = null;

/**
 * Met à jour l'image de la mascotte.
 * @param {string} filename - Nom du fichier image dans `data/mascotte/` (ex: 'bien.png').
 */
function updateMascotteImage(filename) {
    const img = document.getElementById('mascotte-img');
    if (!img) return;
    img.src = `data/mascotte/${filename}`;
}

/**
 * Rend (génère) le menu des matières à partir de l'objet `appData`.
 */
function renderMenuMatieres() {
    const menu = document.getElementById('menu-matieres');
    menu.innerHTML = ''; // vide pour éviter doublons

    Object.keys(appData).forEach((matiere, idx) => {
        const li = document.createElement('li');
        const btn = document.createElement('button');
        btn.className = 'button is-link is-light is-fullwidth mb-2';
        btn.textContent = `${getEmojiForMatiere(matiere)} ${matiere}`;
        btn.setAttribute('data-matiere', matiere);
        btn.addEventListener('click', () => chargerMatiere(matiere));

        li.appendChild(btn);
        menu.appendChild(li);
    });
}

/**
 * Retourne un emoji correspondant à la matière si disponible (cosmétique).
 */
function getEmojiForMatiere(matiere) {
    const map = {
        'Maths': '🔢',
        'Français': '🇫🇷',
        'Anglais': '🇬🇧',
        'Histoire-Géographie': '🌍',
        'SVT': '🌱'
    };
    return map[matiere] || '';
}

// --- 2. GESTION DES SECTIONS ET DE LA MATIÈRE (MIS À JOUR POUR BULMA) ---

/**
 * Affiche ou cache les sections "Cours" et "Quiz" et gère l'état actif des onglets Bulma.
 * @param {string} sectionId - 'cours' ou 'quiz'.
 */
function afficherSection(sectionId) {
    // 1. Cacher/Afficher les sections (utilisation de la classe Bulma 'is-hidden')
    document.getElementById('section-cours').classList.add('is-hidden');
    document.getElementById('section-quiz').classList.add('is-hidden');
    document.getElementById('section-' + sectionId).classList.remove('is-hidden');

    // 2. Mettre à jour l'état actif des onglets (utilisation de la classe Bulma 'is-active' sur l'élément LI)
    document.getElementById('li-btn-cours').classList.remove('is-active');
    document.getElementById('li-btn-quiz').classList.remove('is-active');
    document.getElementById('li-btn-' + sectionId).classList.add('is-active');

    // Si on passe au quiz :
    if (sectionId === 'quiz') {
        const quizNotif = document.querySelector('#section-quiz .notification');
        const quizContainer = document.getElementById('quiz-container');

        // Si aucune matière sélectionnée, afficher la notification d'invite
        if (!currentMatiere) {
            if (quizNotif) quizNotif.style.display = '';
            if (quizContainer) quizContainer.innerHTML = '';
            return;
        }

        // Si une matière est sélectionnée, démarrer le quiz pour cette matière
        if (quizNotif) quizNotif.style.display = 'none';
        demarrerQuiz(currentMatiere);
        return;
    }

    // Si on passe à la section Cours et qu'une matière est déjà sélectionnée,
    // s'assurer que le contenu du cours est rendu pour la matière courante.
    if (sectionId === 'cours') {
        if (currentMatiere) {
            // Afficher le cours de la matière sélectionnée
            afficherCours(currentMatiere);
        }
    }
}

/**
 * Charge et affiche le contenu de la matière sélectionnée.
 * @param {string} matiere - Le nom de la matière (ex: 'Maths').
 */
function chargerMatiere(matiere) {
    currentMatiere = matiere;
    document.getElementById('titre-matiere').textContent = matiere;

    // Si l'onglet actif est 'quiz', rester sur Quiz et démarrer le quiz pour la matière choisie.
    const liQuiz = document.getElementById('li-btn-quiz');
    const isQuizActive = liQuiz && liQuiz.classList.contains('is-active');

    if (isQuizActive) {
        // Masquer la notification d'invite et lancer le quiz pour la matière sélectionnée
        const quizNotif = document.querySelector('#section-quiz .notification');
        if (quizNotif) quizNotif.style.display = 'none';
        afficherSection('quiz');
        demarrerQuiz(matiere);
    } else {
        // 1. Afficher les Cours
        afficherCours(matiere);

        // 2. Afficher la section Cours par défaut
        afficherSection('cours');
    }

    // 3. Mise en évidence de la matière sélectionnée dans le menu (les boutons doivent avoir la classe 'is-active')
    const buttons = document.querySelectorAll('#menu-matieres button');
    buttons.forEach(btn => {
        btn.classList.remove('is-active', 'is-link');
        btn.classList.add('is-light');
    });

    // Assurez-vous d'ajouter la classe 'is-active' au bouton correct.
    const activeBtn = document.querySelector(`button[data-matiere="${matiere}"]`);
    if (activeBtn) {
        activeBtn.classList.remove('is-light'); // retire is-light pour mieux faire ressortir
        activeBtn.classList.add('is-active', 'is-link');
    }
}

/**
 * Désélectionne la matière active : remet l'UI à l'état d'accueil.
 */
function deselectMatiere() {
    currentMatiere = null;

    // Remettre le titre principal
    const titre = document.getElementById('titre-matiere');
    if (titre) titre.textContent = 'Bienvenue ! Choisissez une matière.';

    // Remettre l'image par défaut
    updateMascotteImage('welcome.png');

    // Réinitialiser la zone Cours avec le message d'accueil
    const coursSection = document.getElementById('section-cours');
    if (coursSection) {
        coursSection.innerHTML = `<div class="notification is-info is-light">Sélectionnez une matière dans le menu pour afficher les notions de niveau 5ème.</div>`;
    }

    // Cacher la section quiz et vider son contenu
    const quizSection = document.getElementById('section-quiz');
    const quizContainer = document.getElementById('quiz-container');
    if (quizSection) quizSection.classList.add('is-hidden');
    if (quizContainer) quizContainer.innerHTML = '';

    // Enlever la sélection visuelle dans le menu des matières
    const buttons = document.querySelectorAll('#menu-matieres button');
    buttons.forEach(btn => {
        btn.classList.remove('is-active', 'is-link');
        btn.classList.add('is-light');
    });

    // Retirer l'état actif des onglets Cours/Quiz
    const liCours = document.getElementById('li-btn-cours');
    const liQuiz = document.getElementById('li-btn-quiz');
    if (liCours) liCours.classList.remove('is-active');
    if (liQuiz) liQuiz.classList.remove('is-active');
}


// --- 3. AFFICHAGE DES COURS (MISE À JOUR POUR BULMA) ---

/**
 * Génère et affiche le contenu des notions pour la matière donnée.
 * @param {string} matiere - Le nom de la matière.
 */
function afficherCours(matiere) {
    const coursData = (appData[matiere] && appData[matiere].notions) || [];
    const coursContainer = document.getElementById('section-cours');
    coursContainer.innerHTML = ''; // Nettoie le contenu précédent

    // Créer une copie et la mélanger (Fisher-Yates) pour un affichage aléatoire
    const shuffled = coursData.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }

    shuffled.forEach(notion => {
        const notionCard = document.createElement('div');
        // Utilisation des classes Bulma 'box' et 'block' pour le style/marge
        notionCard.className = 'notion-card box block';

        const contenuHTML = parseContentMarkup(notion.contenu);

        notionCard.innerHTML = `
            <h3 class="title is-4">${notion.titre}</h3>
            <p>${contenuHTML}</p>
        `;
        coursContainer.appendChild(notionCard);
    });
}


// --- 4. GESTION DU QUIZ (MISE À JOUR POUR BULMA) ---

/**
 * Initialise et lance le quiz pour la matière donnée.
 * @param {string} matiere - Le nom de la matière.
 */
function demarrerQuiz(matiere) {
    currentQuestionIndex = 0;
    score = 0;
    afficherQuestion(matiere, currentQuestionIndex);
}

/**
 * Affiche la question actuelle et gère la fin du quiz.
 * @param {string} matiere - Le nom de la matière.
 * @param {number} index - L'index de la question à afficher.
 */
function afficherQuestion(matiere, index) {
    const quizContainer = document.getElementById('quiz-container');
    const questions = appData[matiere].quiz;
    quizContainer.innerHTML = '';
    // Cacher la notification informative qui indique d'appuyer sur Quiz
    const quizNotif = document.querySelector('#section-quiz .notification');
    if (quizNotif) quizNotif.style.display = 'none';

    // Avant sélection, afficher l'image d'accueil
    updateMascotteImage('welcome.png');

    if (index >= questions.length) {
        // Fin du quiz
        quizContainer.innerHTML = `
            <div class="notification is-success has-text-centered">
                <h2 class="title is-4">🎉 Quiz Terminé ! 🎉</h2>
                <p class="subtitle is-5">Votre score final pour ${matiere} est : **${score} / ${questions.length}**.</p>
                <button class="button is-link is-large mt-3" onclick="demarrerQuiz(currentMatiere)">Recommencer le Quiz</button>
            </div>
        `;
        return;
    }

    const question = questions[index];
    const card = document.createElement('div');
    // Utilisation de 'box' de Bulma pour l'encadrement
    card.className = 'question-card box';

    // Affichage de la question
    // Construire le contenu de la carte manuellement pour inclure explication + bouton suivant
    const header = document.createElement('h3');
    header.className = 'title is-5';
    header.textContent = `Question ${index + 1} / ${questions.length}`;

    const qText = document.createElement('p');
    qText.className = 'question-text subtitle is-6';
    qText.innerHTML = parseContentMarkup(question.question);

    const optionsGroup = document.createElement('div');
    optionsGroup.className = 'options-group';

    // Création des boutons d'options
    question.options.forEach(option => {
        const btn = document.createElement('button');
        // Utilisation de classes Bulma pour les boutons
        btn.className = 'option-button button is-light is-fullwidth mb-2';
        btn.innerHTML = parseContentMarkup(option);
        // La fonction verifierReponse est appelée au clic
        btn.onclick = () => verifierReponse(matiere, index, option, btn);
        optionsGroup.appendChild(btn);
    });

    // Explication (masquée jusqu'au clic)
    const explicationDiv = document.createElement('div');
    explicationDiv.className = 'notification is-light mt-3';
    explicationDiv.style.display = 'none';
    explicationDiv.id = 'explication-texte';

    // Bouton suivant / résultat
    const nextBtn = document.createElement('button');
    nextBtn.className = 'button is-link mt-3';
    nextBtn.style.display = 'none';
    nextBtn.textContent = (index === questions.length - 1) ? 'Voir le résultat' : 'Question suivante';
    nextBtn.onclick = () => {
        if (index === questions.length - 1) {
            showResults(matiere);
        } else {
            afficherQuestion(matiere, index + 1);
        }
    };

    // Assembler la carte
    card.appendChild(header);
    card.appendChild(qText);
    card.appendChild(optionsGroup);
    card.appendChild(explicationDiv);
    card.appendChild(nextBtn);

    quizContainer.appendChild(card);
}

/**
 * Vérifie la réponse choisie par l'utilisateur.
 * @param {string} matiere - Le nom de la matière.
 * @param {number} index - L'index de la question actuelle.
 * @param {string} choix - L'option choisie par l'utilisateur.
 * @param {HTMLElement} boutonChoisi - Le bouton sur lequel l'utilisateur a cliqué.
 */
function verifierReponse(matiere, index, choix, boutonChoisi) {
    const question = appData[matiere].quiz[index];
    const card = boutonChoisi.closest('.question-card');
    const boutons = card.querySelectorAll('.option-button');
    const estCorrect = (choix === question.reponse);

    // Désactiver tous les boutons pour éviter de re-cliquer
    boutons.forEach(btn => btn.onclick = null);

    // Mise en évidence de la réponse (visuel)
    boutons.forEach(btn => {
        // comparer le texte brut (sans balises)
        const text = btn.textContent.trim();
        if (text === question.reponse) {
            btn.classList.remove('is-light');
            btn.classList.add('correct', 'is-success');
        } else if (btn === boutonChoisi) {
            btn.classList.remove('is-light');
            btn.classList.add('incorrect', 'is-danger');
        }
    });

    // Mise à jour du score
    if (estCorrect) score++;

    // Afficher l'explication
    const explicationDiv = card.querySelector('#explication-texte');
    if (explicationDiv) {
        explicationDiv.innerHTML = parseContentMarkup(question.explication || '');
        explicationDiv.style.display = 'block';
    }

    // Afficher le bouton suivant / résultat
    const nextBtn = card.querySelector('button.button.is-link');
    if (nextBtn) nextBtn.style.display = 'inline-block';

    // Si la réponse est correcte, déclencher les confettis via js-confetti
    // Feedback visuel immédiat : changer l'image selon correct / incorrect
    if (estCorrect) {
        updateMascotteImage('bien.png');
        try {
            if (jsConfetti && typeof jsConfetti.addConfetti === 'function') {
                jsConfetti.addConfetti({
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

/**
 * Affiche l'écran de résultats du quiz pour la matière donnée
 */
function showResults(matiere) {
    const quizContainer = document.getElementById('quiz-container');
    const questions = appData[matiere].quiz;
    // Mettre l'image finale selon le pourcentage de bonnes réponses
    const total = questions.length;
    const pct = total > 0 ? score / total : 0;
    let finalImg = 'welcome.png';
    if (score === total && total > 0) {
        finalImg = 'parfait.png';
    } else if (pct > 0.5) {
        finalImg = 'bien.png';
    } else if (pct < 0.25) {
        finalImg = 'triste.png';
    } else {
        finalImg = 'dommage.png';
    }
    updateMascotteImage(finalImg);
    // Tir de confettis selon le résultat final : normal (>50%) ou gros (100%)
    try {
        if (jsConfetti && typeof jsConfetti.addConfetti === 'function') {
            if (score === total && total > 0) {
                // Gros jet de confettis pour 100% : plusieurs rafales
                jsConfetti.addConfetti({
                    confettiNumber: 220,
                    confettiColors: ['#ffd700', '#ff7096', '#8ec5ff', '#7ee5b5'],
                });
                // Petite rafale supplémentaire pour effet
                setTimeout(() => {
                    try { jsConfetti.addConfetti({ confettiNumber: 120, confettiColors: ['#ffd700', '#7ee5b5'] }); } catch (e) { /* ignore */ }
                }, 350);
            } else if (pct > 0.5) {
                // Jet de confettis standard pour >50%
                jsConfetti.addConfetti({
                    confettiNumber: 60,
                    confettiColors: ['#4CAF50', '#8ec5ff', '#ff7096']
                });
            }
        }
    } catch (e) {
        console.warn('Erreur lors du tir de confettis de résultat :', e);
    }
    quizContainer.innerHTML = `
        <div class="notification is-success has-text-centered">
            <h2 class="title is-4">🎉 Quiz Terminé ! 🎉</h2>
            <p class="subtitle is-5">Votre score final pour ${matiere} est : <strong>${score} / ${questions.length}</strong>.</p>
            <button class="button is-link is-large mt-3" onclick="demarrerQuiz('${matiere}')">Recommencer le Quiz</button>
        </div>
    `;
}

// --- 5. INITIALISATION (Lancement) ---

// S'assure que le JavaScript démarre quand la page est chargée
document.addEventListener('DOMContentLoaded', () => {
    // Charger le JSON des matières puis rendre le menu (pas de chargement automatique)
    fetch('data/matieres.json')
        .then(response => {
            if (!response.ok) throw new Error('Erreur lors du chargement de data/matieres.json');
            return response.json();
        })
        .then(data => {
            appData = data;
            renderMenuMatieres();
            // Attacher le clic sur le titre du hero pour désélectionner la matière
            const heroTitle = document.getElementById('hero-title');
            if (heroTitle) heroTitle.addEventListener('click', deselectMatiere);

            // Initialiser JSConfetti si disponible (chargé via CDN dans index.html)
            try {
                if (typeof JSConfetti !== 'undefined') {
                    jsConfetti = new JSConfetti();
                }
            } catch (e) {
                console.warn('JSConfetti non initialisé :', e);
                jsConfetti = null;
            }
            // --- Ajuster la variable CSS --header-height pour limiter correctement
            // la hauteur des sections de contenu (utile sur petits écrans).
            function updateHeaderHeightVar() {
                const header = document.querySelector('header.hero');
                const h = header ? header.offsetHeight : 140;
                document.documentElement.style.setProperty('--header-height', h + 'px');
            }

            // Initial set + update on resize (debounced simple)
            updateHeaderHeightVar();
            let _resizeTimer = null;
            window.addEventListener('resize', () => {
                clearTimeout(_resizeTimer);
                _resizeTimer = setTimeout(updateHeaderHeightVar, 120);
            });
        })
        .catch(err => {
            const menu = document.getElementById('menu-matieres');
            menu.innerHTML = '<li><div class="notification is-danger">Impossible de charger les matières.</div></li>';
            console.error(err);
        });
});
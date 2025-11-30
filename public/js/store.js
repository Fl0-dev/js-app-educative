// Store centralisé pour l'état partagé
export const store = {
    appData: {},
    currentMatiere: null,
    currentQuestionIndex: 0,
    score: 0,
    currentQuizQuestions: [],
    jsConfetti: null,
    // Taille du dernier quiz lancé (5, 10, 20, ...). Permet de recommencer avec la même taille.
    lastQuizSize: null
};

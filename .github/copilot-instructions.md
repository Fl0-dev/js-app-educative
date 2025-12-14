## Résumé rapide

Ce dépôt est une petite application Web éducative (Vanilla JS, Bulma) servie par un serveur Node/Express minimal (`server.js`) qui expose le dossier `public/`. Le code client utilise des modules ES (`type="module"` dans `public/index.html`) et un store central (`public/js/store.js`). Les matières et quiz sont fournis comme JSON dans `public/data/`.

## Architecture & flux de données (essentiel)

-   **Server**: `server.js` — serveur Express très simple servant les fichiers statiques depuis `public/` sur le port 3000 (processus principal). Pour le dev local on peut lancer `npm start` ou `npm run dev`.
-   **Entrée client**: `public/index.html` importe `public/js/init.js` (ES modules).
-   **State central**: `public/js/store.js` contient `store` — toutes les vues lisent/écrivent cet objet.
-   **Chargement des données**: `public/js/init.js` charge `data/matieres/index.json` (tableau d'objets {name,file,emoji}) puis fait `fetch` de chaque `data/<file>` et assemble `store.appData`. Si l'index ou les fichiers individuels échouent, le code bascule sur `public/data/matieres.json` (monolithe) — utile pour inputs de fallback.
-   **Contrats de données**: chaque fichier matière attendu contient au minimum `notions` (array d'objets {titre, contenu}) et souvent `quiz` (array de questions {question, options, reponse, explication}). Exemple logique: `store.appData['Maths'].notions` et `store.appData['Maths'].quiz`.

## Conventions et patterns spécifiques

-   Utilisation d'ES modules côté client (import/export) — éviter les bundlers; conservez les chemins relatifs exacts (ex: `import { store } from './store.js'`).
-   Manipulation DOM manuelle: UI driven par fonctions exportées dans `public/js/ui.js` (ex: `renderSubjectMenu`, `loadSubject`, `showSection`). Respecter les classes Bulma et les classes utilitaires personnalisées (`is-custom`, `is-light`, `is-active`).
-   `parseContentMarkup` (dans `public/js/utils.js`) gère uniquement les **bold** (markdown minimal) et les sauts de ligne — n'ajoutez pas d'autres syntaxes sans mettre à jour cette fonction.
-   `getEmojiForSubject` normalise les noms (suppression d'accents et caractères non-alphanumériques). Les fichiers `data/` peuvent contenir une propriété `emoji` dans l'index ou dans chaque matière.
-   Fichiers/dossiers avec caractères accentués existent (`Améloration.md`, `Géographie.json`) — faire attention aux opérations fichiers/URL et utiliser la normalisation si nécessaire.

## Développement & commandes utiles

-   Lancer local sans Docker: `npm install` puis `npm start` (écoute sur `:3000`).
-   Mode dev (nodemon): `npm run dev` pour rechargement automatique.
-   Docker (voir `README.md` pour détails) :
    -   Build: `docker build -t app-educative-5eme .`
    -   Run: `docker run -d -p 8080:3000 --name educ-app app-educative-5eme`
    -   Dev with bind-mounts (hot reload): bind `public/` et `server.js` et lancer `npm run dev` dans le conteneur (exemple exact dans `README.md`).

## Points d'attention pour un agent IA

-   Ne pas modifier la façon dont les modules sont importés — garder les imports relatifs (ex: `./store.js`).
-   Respecter le `store` central — éviter de dupliquer l'état (mettre à jour `store.*`).
-   Les modifications sur les données JSON doivent conserver la structure `notions` / `quiz` / `emoji` pour rester compatibles.
-   Les interactions UI attendent des éléments DOM spécifiques (`#menu-matieres`, `#quiz-container`, `#mascotte-img`, etc.). Si vous renommez un ID, mettez à jour toutes les références dans `public/js/*.js`.
-   Les images mascotte sont dans `public/data/mascotte/` et sont référencées par `updateMascotImage(filename)` — manipulez les chemins relatifs en conséquence.

## Fichiers clés à consulter pour modifications

-   `server.js` — serveur statique
-   `package.json` — scripts (`start`, `dev`)
-   `public/index.html` — point d'entrée + `type="module"`
-   `public/js/init.js` — chargement des données et initialisation
-   `public/js/store.js` — état central
-   `public/js/ui.js`, `public/js/quiz.js`, `public/js/utils.js` — logique UI, quiz et utilitaires
-   `public/data/matieres/index.json` et les fichiers `public/data/matieres/*.json` — modèle de données

## Exemple concret (réparer un bug de donnée)

Si un sujet n'affiche pas ses notions: vérifiez que `store.appData[subject].notions` existe et est un tableau. Pour déboguer, ouvrez la console du navigateur et exécutez `console.log(Object.keys(store.appData))` ou inspectez `store.appData["NomDeMatiere"]`.

---

Si vous voulez que j'intègre des extraits d'exemples JSON (ex: schéma d'une matière) ou que je fusionne ce fichier avec un `.github/copilot-instructions.md` existant, dites-le et je l'ajusterai.

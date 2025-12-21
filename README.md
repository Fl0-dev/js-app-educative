
# js-app-educative

Application éducative (Vanilla JS + Bulma) — instructions d'installation, d'exécution et de développement local.

**Pré-requis**

- **Node.js** : version 14+ recommandée (v16+ préférable). Vérifiez avec `node -v`.
- **npm** : fourni avec Node.js. Vérifiez avec `npm -v`.
- **Docker** (optionnel) : pour exécuter l'image conteneurisée.

**Installation (première fois)**

1. Clonez le dépôt et placez-vous dans le dossier :

```
git clone <repo-url> && cd js-app-educative
```

2. Installez les dépendances :

```
npm install
```

**Exécuter l'application**

- Mode production (serveur statique minimal) :

```
npm start
```

- Mode développement (rechargement automatique si `nodemon` est configuré) :

```
npm run dev
```

Ouvrez ensuite `http://localhost:3000` dans votre navigateur.

**Structure importante du projet**

- `server.js` : petit serveur Express qui sert `public/`.
- `public/index.html` : point d'entrée client (importe `public/js/init.js` en tant que module ES).
- `public/js/` : code client principal — `init.js`, `store.js`, `ui.js`, `quiz.js`, `utils.js`.
- `public/data/matieres/` : fichiers JSON pour chaque matière + `index.json`.
- `public/data/mascotte/` : images mascotte.

Consultez `public/js/store.js` : c'est le store central de l'application. Ne dupliquez pas l'état — mettez à jour `store`.

**Chargement des données**

- `public/js/init.js` lit `public/data/matieres/index.json` (tableau `{name,file,emoji}`) et fait un `fetch` pour charger chaque fichier `public/data/matieres/<file>`. Si un chargement échoue, le code bascule sur un fichier monolithique de secours (`public/data/matieres.json`) si présent.
- Format attendu pour chaque matière :

```
{
    "notions": [ { "titre": "...", "contenu": "..." } ],
    "quiz": [ { "question": "...", "options": [...], "reponse": 0, "explication": "..." } ],
    "emoji": "📘"
}
```

Pour ajouter une nouvelle matière :

1. Ajouter `public/data/matieres/Nouvelle.json` suivant le schéma ci-dessus.
2. Mettre à jour `public/data/matieres/index.json` en ajoutant un objet `{ "name": "Nouvelle", "file": "Nouvelle.json", "emoji": "🔬" }`.

Respectez la normalisation des noms (accents et caractères spéciaux peuvent exister dans les fichiers).

**Conseils de développement**

- Le code client utilise des modules ES : conservez les imports relatifs (ex. `import { store } from './store.js'`).
- UI manipulée manuellement via DOM — `public/js/ui.js` expose des fonctions comme `renderSubjectMenu`, `loadSubject`, `showSection`.
- Ne modifiez pas les IDs DOM existants (`#menu-matieres`, `#quiz-container`, etc.) sans mettre à jour toutes les références dans `public/js/*.js`.
- Pour déboguer les données : ouvrez la console du navigateur et inspectez `store.appData` (ex. `console.log(Object.keys(store.appData))`).

**Docker (optionnel)**

Build de l'image :

```
docker build -t app-educative-5eme .
```

Run (expose le serveur sur le port 8080 de la machine hôte) :

```
docker run -d -p 8080:3000 --name educ-app app-educative-5eme
```

Pour le développement avec volumes (hot-reload), montez `public/` et `server.js` et lancez le script `npm run dev` à l'intérieur du conteneur.

**Tests & vérification rapide**

- Il n'y a pas de suite de tests automatisés fournie. Pour vérifier rapidement :
    - Lancez `npm run dev`.
    - Ouvrez `http://localhost:3000` et vérifiez la console du navigateur pour des erreurs.
    - Vérifiez que la liste des matières s'affiche et que `store.appData` contient les données attendues.

**Bonnes pratiques et contributions**

- Créez une branche dédiée : `feature/xxx` ou `fix/yyy`.
- Respectez les conventions ES modules et ne changez pas les chemins d'import relatifs.
- Si vous modifiez la structure des données JSON, mettez à jour `public/js/init.js` et `public/js/utils.js` si nécessaire.

Si vous souhaitez que j'ajoute des extraits JSON d'exemple ou que je crée un script d'aide pour générer une nouvelle matière, dites-le et je l'ajouterai.

---
Version courte : lancez `npm install`, puis `npm start` (ou `npm run dev`), ouvrez `http://localhost:3000`.

## Fonctionnalités

- Consultation de cours pour plusieurs matières de niveau 5ème.
- Réalisation de quiz interactifs pour tester les connaissances.
- Interface utilisateur simple et intuitive.
- Conteneurisation avec Docker pour un déploiement facile.
- Support du rechargement à chaud en mode développement.
- Gestion des matières via un index JSON pour une meilleure modularité.
- Utilisation de Bulma pour un design responsive et moderne.
- Intégration d'une mascotte interactive pour une expérience utilisateur ludique.

## 🐳 Prérequis

Assurez-vous d'avoir les outils suivants installés sur votre système (Windows avec WSL ou Linux) :

- **Docker Desktop** (ou moteur Docker)
- **Node.js** (pour la gestion des dépendances via `npm`, même si l'installation se fait dans le conteneur)
- Dépendances de développement (Express et Nodemon doivent être installés via npm install AVANT le build de l'image de DEV).

---

## 🚀 1. Lancement Initial de l'Application

Ces commandes vous permettent de construire l'image Docker, de lancer le conteneur et d'accéder à l'application.

### **Étape 1 : Construction de l'Image Docker**

Placez-vous dans le répertoire racine du projet (`js-app-educative`) où se trouvent le `Dockerfile` et les dossiers `public` et exécutez :

```bash
docker build -t app-educative-5eme .
```

- `app-educative-5eme` : Nom de l'image.
- `.` : Indique à Docker d'utiliser le `Dockerfile` dans le répertoire actuel.

### **Étape 2 : Lancement du Conteneur**

Une fois l'image construite, lancez le conteneur en mappant le port interne **3000** (du serveur Node.js) au port **8080** de votre machine hôte :

```bash
docker run -d -p 8080:3000 --name educ-app app-educative-5eme
```

- `-d` : Lance le conteneur en mode détaché (en arrière-plan).
- `--name educ-app` : Donne un nom facile à gérer au conteneur.

### **Étape 3 : Accès à l'Application**

Ouvrez votre navigateur web et accédez à :

```bash
http://localhost:8080
```

---

## 🛠️ 2. Gestion et Mise à Jour du Conteneur

Ces commandes sont utiles lorsque vous modifiez le code source (dans les fichiers `.js`, `.html`, `.css`) et que vous souhaitez mettre à jour l'application en cours d'exécution.

| Action                    | Commande                | Explication                                                                 |
| :------------------------ | :---------------------- | :-------------------------------------------------------------------------- |
| **Vérifier l'état**       | `docker ps`             | Affiche les conteneurs actifs (vérifiez que `educ-app` est en statut `Up`). |
| **Voir les logs**         | `docker logs educ-app`  | Affiche les messages du serveur Node.js (utile pour le débogage).           |
| **Arrêter le conteneur**  | `docker stop educ-app`  | Arrête l'exécution de l'application.                                        |
| **Démarrer le conteneur** | `docker start educ-app` | Redémarre l'application après un arrêt.                                     |

---

## 🔄 3. Mise à Jour du Code Source

Toute modification dans le dossier `public/` nécessite une **reconstruction** de l'image Docker, car le contenu est copié pendant la phase de _build_.

1. **Arrêter et Supprimer l'Ancien Conteneur :**

    ```bash
    docker stop educ-app
    docker rm educ-app
    ```

2. **Reconstruire l'Image :**

    ```bash
    docker build -t app-educative-5eme .
    ```

3. **Relancer le Nouveau Conteneur :**

    ```bash
    docker run -d -p 8080:3000 --name educ-app app-educative-5eme
    ```

## 🚀 Lancement en Mode Développement (Hot Reload)

Cette commande utilise des **Volumes Docker (Bind Mounts)** et **Nodemon** pour synchroniser le code de votre machine avec le conteneur, permettant une mise à jour instantanée des changements JS/HTML/CSS.

1. **Supprimer l'ancien conteneur si actif :**

    ```bash
    docker stop educ-app
    docker rm educ-app
    ```

2. **Lancer le conteneur de DEV :**

    ```bash
    docker run -d -p 8080:3000 --name educ-app-dev \
      -v "$(pwd)/public:/usr/src/app/public" \
      -v "$(pwd)/server.js:/usr/src/app/server.js" \
      app-educative-5eme-dev npm run dev
    ```

---

## 🗑️ 4. Nettoyage

Commandes pour nettoyer votre environnement Docker.

- **Supprimer l'Image (après avoir supprimé le conteneur) :**

    ```bash
    docker rmi app-educative-5eme
    ```

- **Supprimer tous les conteneurs arrêtés :**

    ```bash
    docker container prune
    ```

# 📚 README : Application Éducative 5ème (JS & Docker)

Cette application Web simple, développée en JavaScript Vanilla et servie par Node.js (Express), est conteneurisée à l'aide de Docker. Elle permet de consulter des cours et de faire des quiz pour plusieurs matières de niveau 5ème.

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

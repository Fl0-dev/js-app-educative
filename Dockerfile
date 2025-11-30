# 1. Utiliser une image de base Node.js légère
FROM node:20-alpine

# 2. Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# 3. Copier les fichiers de l'application
COPY package*.json ./
COPY server.js .
COPY public ./public

# 4. Installer les dépendances (Express.js)
RUN npm install

# 5. Exposer le port sur lequel l'application s'exécute
EXPOSE 3000

# 6. Commande de lancement de l'application
CMD [ "node", "server.js" ]
# Conception : modèle utilisateur et contrat API (auth + résultats)

Ce document définit le modèle de données minimal et les endpoints HTTP nécessaires pour l'authentification (register/login) et la persistance des résultats de quiz.

## Modèle utilisateur (JSON)

Fichier de stockage proposé : `data/users.json`

Exemple initial :

```json
{
  "users": []
}
```

Chaque utilisateur stocké :

```json
{
  "id": "uuid-v4",
  "username": "alice",
  "passwordHash": "<bcrypt-hash>",
  "createdAt": "2025-12-14T12:00:00Z",
  "results": [
    {
      "id": "result-id",
      "subject": "Maths",
      "date": "2025-12-14T13:00:00Z",
      "score": 8,
      "total": 10,
      "size": 10
    }
  ]
}
```

Remarques :

- `passwordHash` contient le hash bcrypt (ne jamais exposer).
- `results` est un tableau append-only des résultats de quiz.

## Variables d'environnement

- `JWT_SECRET` : secret pour signer les JWT. En dev, prévoir une valeur par défaut, mais ne pas l'utiliser en production.
- Optionnel : `JWT_EXPIRES_IN` (ex: `7d`).

## Endpoints HTTP (contrat)

Toutes les routes sont préfixées par `/api`.

1) POST /api/register
   - body: { "username": string, "password": string }
   - validations : username >= 3 chars, password >= 6 chars, username unique
   - action : crée l'utilisateur, hash du mot de passe (bcrypt), écrit dans `data/users.json`
   - response 201: { "token": "<jwt>", "user": { "id", "username" } }
   - erreurs : 400 (bad input), 409 (username exists)

2) POST /api/login
   - body: { "username", "password" }
   - action : recherche user, compare password via bcrypt.compare, retourne JWT
   - response 200: { "token": "<jwt>", "user": { "id", "username" } }
   - erreurs : 400 / 401

3) GET /api/me
   - headers: Authorization: Bearer <token>
   - action : vérifie JWT, retourne { "user": { "id", "username" } }
   - erreurs : 401 si token invalide

4) POST /api/results
   - headers: Authorization: Bearer <token>
   - body: { "subject": string, "score": number, "total": number, "size"?: number }
   - validations : score & total entiers, 0 <= score <= total, total raisonnable
   - action : ajoute un objet result `{ id, subject, date, score, total, size }` dans `user.results` et writeFile
   - response 201: { "ok": true, "resultId": "..." }
   - erreurs : 400 (bad input), 401 (unauthorized)

5) GET /api/results
   - headers: Authorization: Bearer <token>
   - optional query: `?subject=Maths`
   - response 200: { "results": [ ... ] }

Notes de validation et sécurité :

- Toujours valider côté serveur. Ne faire aucune confiance au client (p.ex. score envoyé doit respecter 0 <= score <= total).
- Ne jamais retourner `passwordHash` dans les réponses.
- Limiter la taille maximale de `results` ou prévoir pagination si nécessaire.
- Pour les écritures sur fichier, utiliser `fs.promises.readFile` puis `writeFile` atomique (écrire un `.tmp` puis `rename`) pour réduire le risque de corruption.

## JWT (utilisation)

- Payload minimal : `{ "id": "user-id", "username": "alice" }`.
- Signer avec `JWT_SECRET`. Durée de validité configurable (`JWT_EXPIRES_IN`).

## Verrouillage / concurrence (recommandation)

- Implémentation simple : lectures/écritures séquentielles (Promise chain). Pour éviter races, on peut ajouter un petit verrou mémoire (Map of promises) côté serveur qui queue les modifications du fichier `data/users.json`.
- Pour une production future : migrer vers SQLite/Postgres pour éviter problèmes d'I/O.

## Exemple d'erreurs et codes renvoyés

- 200 OK — lecture réussie
- 201 Created — ressource créée (register, post results)
- 400 Bad Request — données invalides
- 401 Unauthorized — token manquant ou invalide
- 409 Conflict — username déjà utilisé

## Étapes suivantes recommandées

- Implémenter `server/api-users.js` (router Express) : routes décrites ci-dessus.
- Ajouter `app.use(express.json())` et `app.use('/api', require('./server/api-users'))` dans `server.js`.
- Créer `data/users.json` initial `{ "users": [] }`.
- Implémenter `public/js/auth.js`, intégrer au front (login/register) et stocker le token dans `localStorage`.

---
Fichier créé pour la première étape : design du modèle et contrat API. Passe à l'implémentation des routes quand tu es prêt.

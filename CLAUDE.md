# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install        # Install dependencies
npm start          # Run production server on :3000
npm run dev        # Run with nodemon (auto-reload on changes)

# Docker
docker build -t app-educative-5eme .
docker run -d -p 8080:3000 --name educ-app app-educative-5eme
```

No test suite exists — manual testing via browser console.

## Architecture

**Vanilla JS + Bulma CSS** educational web app (French 5th grade). Express serves static files; client uses ES modules with no bundler.

### Data flow

1. `server.js` — Express on port 3000, serves `public/`, mounts `/api/*` from `server/api-users.js`
2. `public/index.html` — Entry point, loads `public/js/init.js` as ES module
3. `public/js/init.js` — On DOMContentLoaded: fetches `data/matieres/index.json` (array of `{name, file, emoji}`), fetches each subject file, populates `store.appData`. Falls back to `public/data/matieres.json` monolith if individual files fail
4. `public/js/store.js` — Singleton state object; mutated directly (no actions/reducers). All modules import from here
5. Rendering: `ui.js` (menus, sections), `quiz.js` (shuffle, scoring, mascot), `auth.js` (JWT login/register), `utils.js` (markup parsing, emoji resolution, date formatting)

### Subject data contract

Each `public/data/matieres/<Subject>.json` must have:
```json
{
  "notions": [{ "titre": "...", "contenu": "..." }],
  "quiz":    [{ "question": "...", "options": [...], "reponse": 0, "explication": "..." }],
  "emoji":   "📘"
}
```
`reponse` is the 0-based index of the correct option.

To add a subject: create the JSON file and register it in `public/data/matieres/index.json`.

### Backend API (`server/api-users.js`)

- `POST /api/register` / `POST /api/login` — auth with bcrypt + JWT
- `GET /api/me` — profile with aggregated stats
- `POST /api/results` / `GET /api/results` — quiz history (keeps last 5 per user)
- User data stored in `data/users.json` (file-based, not MongoDB despite `.env.local` containing `MONGODB_URI`)
- JWT secret read from `process.env.JWT_SECRET`

## Key conventions

- **ES modules, no bundler** — keep all client imports as relative paths (e.g., `import { store } from './store.js'`). Do not introduce a build step.
- **Manual DOM manipulation** — no React/Vue. Respect existing DOM IDs (`#menu-matieres`, `#quiz-container`, `#mascotte-img`, etc.). Renaming an ID requires updating all references in `public/js/*.js`.
- **`parseContentMarkup`** in `utils.js` handles only `**bold**` and `\n→<br>`. Do not add new markdown syntax without updating this function.
- **Mascot images** live in `public/data/mascotte/`; updated via `updateMascotImage(filename)` in `utils.js`.
- **Accented filenames** exist (e.g., `Géographie.json`, `Améliorations.md`) — be careful with file operations and URLs; use `getEmojiForSubject`'s normalization as a reference.
- **State**: always update `store.*` directly; never duplicate state in local variables that live across function calls.

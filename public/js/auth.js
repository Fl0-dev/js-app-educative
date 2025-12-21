import { store } from './store.js';
import { formatFrenchDate } from './utils.js';

// Minimal client-side auth helper: register, login, logout, init UI
const API_BASE = '/api';

export async function register(username, password) {
    const res = await fetch(API_BASE + '/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return res.json();
}

export async function login(username, password) {
    const res = await fetch(API_BASE + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
    });
    return res.json();
}

export function logout() {
    store.authToken = null;
    store.currentUser = null;
    localStorage.removeItem('authToken');
    updateAuthUI();
}

export async function fetchMe(token) {
    const res = await fetch(API_BASE + '/me', { headers: { Authorization: 'Bearer ' + token } });
    return res.json();
}

function showMessage(msg, isError = false) {
    const el = document.getElementById('auth-msg');
    if (!el) return;
    el.textContent = msg || '';
    el.className = isError ? 'has-text-danger' : 'has-text-success';
}

export function updateAuthUI() {
    const userSpan = document.getElementById('auth-user');
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const btnProfile = document.getElementById('btn-profile');
    const btnLogout = document.getElementById('btn-logout');
    const formWrapper = document.getElementById('auth-form-wrapper');

    if (store.currentUser) {
        if (userSpan) userSpan.textContent = store.currentUser.username;
        if (btnLogin) btnLogin.style.display = 'none';
        if (btnRegister) btnRegister.style.display = 'none';
        if (btnProfile) btnProfile.style.display = '';
        if (btnLogout) btnLogout.style.display = '';
        if (formWrapper) formWrapper.style.display = 'none';
    } else {
        if (userSpan) userSpan.textContent = '';
        if (btnLogin) btnLogin.style.display = '';
        if (btnRegister) btnRegister.style.display = '';
        if (btnProfile) btnProfile.style.display = 'none';
        if (btnLogout) btnLogout.style.display = 'none';
    }

    // Mettre à jour le h2 titre avec le nom de l'utilisateur si aucun sujet n'est sélectionné
    try {
        const titre = document.getElementById('titre-matiere');
        if (titre && !store.currentSubject) {
            if (store.currentUser && store.currentUser.username) {
                titre.textContent = `Bienvenue, ${store.currentUser.username} ! Choisissez une matière.`;
            } else {
                titre.textContent = 'Bienvenue ! Choisissez une matière.';
            }
        }
    } catch (e) {
        // noop
    }
}

function toggleForm(mode) {
    const wrapper = document.getElementById('auth-form-wrapper');
    const title = document.getElementById('auth-form-title');
    const submitBtn = document.getElementById('auth-form-submit');
    if (!wrapper || !title || !submitBtn) return;
    wrapper.style.display = '';
    title.textContent = mode === 'register' ? "S'inscrire" : "Se connecter";
    submitBtn.dataset.mode = mode;
    submitBtn.textContent = mode === 'register' ? "S'inscrire" : "Connexion";
}

export function initAuthUI() {
    // Attach handlers
    const btnLogin = document.getElementById('btn-login');
    const btnRegister = document.getElementById('btn-register');
    const btnLogout = document.getElementById('btn-logout');
    const form = document.getElementById('auth-form');

    if (btnLogin) btnLogin.addEventListener('click', () => toggleForm('login'));
    if (btnRegister) btnRegister.addEventListener('click', () => toggleForm('register'));
    const btnProfile = document.getElementById('btn-profile');
    if (btnProfile) btnProfile.addEventListener('click', () => showProfileModal());
    if (btnLogout) btnLogout.addEventListener('click', () => logout());

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const mode = document.getElementById('auth-form-submit').dataset.mode || 'login';
            const username = document.getElementById('auth-username').value.trim();
            const password = document.getElementById('auth-password').value;
            showMessage('');
            try {
                let data;
                if (mode === 'register') data = await register(username, password);
                else data = await login(username, password);

                if (data && data.token) {
                    store.authToken = data.token;
                    store.currentUser = data.user || null;
                    localStorage.setItem('authToken', data.token);
                    updateAuthUI();
                    showMessage('Authentification réussie');
                    // hide form
                    document.getElementById('auth-form-wrapper').style.display = 'none';
                } else if (data && data.error) {
                    showMessage(data.error, true);
                } else {
                    showMessage('Erreur inconnue', true);
                }
            } catch (e) {
                console.error('auth error', e);
                showMessage('Erreur réseau', true);
            }
        });
    }

    const cancelBtn = document.getElementById('auth-form-cancel');
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
        const wrapper = document.getElementById('auth-form-wrapper');
        if (wrapper) wrapper.style.display = 'none';
        showMessage('');
    });

    // Close the auth form when clicking outside of the auth area
    document.addEventListener('click', (e) => {
        const wrapper = document.getElementById('auth-form-wrapper');
        const area = document.getElementById('auth-area');
        if (!wrapper || !area) return;
        // if wrapper is not visible, nothing to do
        try {
            const disp = window.getComputedStyle(wrapper).display;
            if (disp === 'none') return;
        } catch (err) {
            return;
        }
        // if the click happened outside the whole auth area, close the wrapper
        if (!area.contains(e.target)) {
            wrapper.style.display = 'none';
            showMessage('');
        }
    });

    // On init, restore token from localStorage
    const token = localStorage.getItem('authToken');
    if (token) {
        // optimistic set
        store.authToken = token;
        fetchMe(token).then(data => {
            if (data && data.user) {
                store.currentUser = data.user;
            } else {
                store.authToken = null;
                localStorage.removeItem('authToken');
            }
            updateAuthUI();
        }).catch(() => {
            store.authToken = null;
            localStorage.removeItem('authToken');
            updateAuthUI();
        });
    } else {
        updateAuthUI();
    }
}

// date formatting is provided by `utils.formatFrenchDate`

// Render profile modal: fetch /api/me and /api/results and populate modal
export async function showProfileModal() {
    const modal = document.getElementById('profile-modal');
    const modalBg = document.getElementById('profile-modal-bg');
    const modalClose = document.getElementById('profile-modal-close');
    const modalClose2 = document.getElementById('profile-modal-close-2');
    if (!modal) return;
    // helper to hide
    function hide() { modal.classList.remove('is-active'); }
    function show() { modal.classList.add('is-active'); }

    // Attach close handlers
    if (modalBg) modalBg.addEventListener('click', hide, { once: true });
    if (modalClose) modalClose.addEventListener('click', hide, { once: true });
    if (modalClose2) modalClose2.addEventListener('click', hide, { once: true });

    // Clear previous
    const nameEl = document.getElementById('profile-name');
    const generalEl = document.getElementById('profile-general');
    const totalsEl = document.getElementById('profile-totals');
    const resultsEl = document.getElementById('profile-results');
    if (nameEl) nameEl.textContent = '';
    if (generalEl) generalEl.textContent = '';
    if (totalsEl) totalsEl.innerHTML = '';
    if (resultsEl) resultsEl.innerHTML = '';

    // Fetch profile and results
    try {
        const headers = authHeaders();
        const meResp = await fetch('/api/me', { headers });
        if (meResp.status === 401) { logout(); return; }
        const me = await meResp.json();
        const resultsResp = await fetch('/api/results', { headers });
        const resultsJson = resultsResp.ok ? await resultsResp.json() : { results: [] };

        const user = me.user || {};
        if (nameEl) nameEl.textContent = user.username ? `Bienvenue, ${user.username}` : 'Bienvenue';

        // general score computed from totals
        const totals = user.totals || {};
        let totalCorrect = 0, totalQuestions = 0;
        for (const subj of Object.keys(totals)) {
            const t = totals[subj];
            totalCorrect += (t.correct || 0);
            totalQuestions += (t.questions || 0);
        }
        if (generalEl) generalEl.textContent = `Score général : ${totalCorrect} / ${totalQuestions}`;

        // per-subject list
        if (totalsEl) {
            if (Object.keys(totals).length === 0) {
                totalsEl.innerHTML = '<li>Aucun résultat par matière.</li>';
            } else {
                for (const subj of Object.keys(totals)) {
                    const t = totals[subj];
                    const li = document.createElement('li');
                    li.textContent = `${subj} : ${t.correct || 0} / ${t.questions || 0}`;
                    totalsEl.appendChild(li);
                }
            }
        }

        // last 5 quizzes
        const lastResults = (resultsJson.results || []).slice().reverse();
        if (resultsEl) {
            if (lastResults.length === 0) {
                resultsEl.innerHTML = '<div>Aucun quiz enregistré.</div>';
            } else {
                lastResults.forEach(r => {
                    const wrap = document.createElement('div');
                    wrap.className = 'box';
                    const d = formatFrenchDate(r.date);
                    wrap.innerHTML = `
                        <div><strong>${r.subject}</strong> — ${r.score} / ${r.total} (${r.size} questions)</div>
                        <div class="has-text-grey is-size-7"><em>${d}</em></div>
                    `;
                    resultsEl.appendChild(wrap);
                });
            }
        }

        show();
    } catch (e) {
        console.error('profile fetch error', e);
    }
}

export function authHeaders() {
    const t = store.authToken || localStorage.getItem('authToken');
    if (!t) return {};
    return { Authorization: 'Bearer ' + t };
}

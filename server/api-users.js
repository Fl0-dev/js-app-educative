const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const USERS_PATH = path.join(__dirname, '..', 'data', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const BCRYPT_ROUNDS = 10;

// Simple file write queue to avoid races
let writeQueue = Promise.resolve();
function queueWrite(fn) {
    writeQueue = writeQueue.then(() => fn());
    return writeQueue;
}

async function readUsers() {
    try {
        const raw = await fs.readFile(USERS_PATH, 'utf8');
        return JSON.parse(raw);
    } catch (e) {
        if (e.code === 'ENOENT') return { users: [] };
        throw e;
    }
}

async function writeUsers(data) {
    // atomic write: write to tmp then rename
    const tmp = USERS_PATH + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(data, null, 2), 'utf8');
    await fs.rename(tmp, USERS_PATH);
}

function signForUser(user) {
    return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

async function findUserByUsername(usersData, username) {
    return usersData.users.find(u => u.username.toLowerCase() === (username || '').toLowerCase());
}

// Register
router.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ error: 'username and password required' });
        if (typeof username !== 'string' || username.length < 3) return res.status(400).json({ error: 'Ton nom est trop court' });
        if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'Ton mot de passe est trop court' });

        const usersData = await readUsers();
        const exists = await findUserByUsername(usersData, username);
        if (exists) return res.status(409).json({ error: "Ce nom existe déjà" });

        const id = (crypto.randomUUID && crypto.randomUUID()) || crypto.randomBytes(16).toString('hex');
        const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
        const newUser = { id, username, passwordHash, createdAt: new Date().toISOString(), results: [] };

        usersData.users.push(newUser);
        await queueWrite(() => writeUsers(usersData));

        const token = signForUser(newUser);
        return res.status(201).json({ token, user: { id: newUser.id, username: newUser.username } });
    } catch (e) {
        console.error('register error', e);
        return res.status(500).json({ error: 'internal' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body || {};
        if (!username || !password) return res.status(400).json({ error: 'username and password required' });

        const usersData = await readUsers();
        const user = await findUserByUsername(usersData, username);
        if (!user) return res.status(401).json({ error: 'invalid credentials' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'invalid credentials' });

        const token = signForUser(user);
        return res.status(200).json({ token, user: { id: user.id, username: user.username } });
    } catch (e) {
        console.error('login error', e);
        return res.status(500).json({ error: 'internal' });
    }
});

// Auth middleware
function authMiddleware(req, res, next) {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: 'no token' });
    const parts = auth.split(' ');
    if (parts.length !== 2) return res.status(401).json({ error: 'bad auth header' });
    const token = parts[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        req.user = payload;
        return next();
    } catch (e) {
        return res.status(401).json({ error: 'invalid token' });
    }
}

// GET /me
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const usersData = await readUsers();
        const user = usersData.users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ error: 'not found' });
        // include totals (aggregates per subject) to help the client render a profile summary
        return res.status(200).json({ user: { id: user.id, username: user.username, totals: user.totals || {} } });
    } catch (e) {
        console.error('me error', e);
        return res.status(500).json({ error: 'internal' });
    }
});

// POST /results
router.post('/results', authMiddleware, async (req, res) => {
    try {
        const { subject, score, total, size } = req.body || {};
        if (typeof subject !== 'string' || subject.length === 0) return res.status(400).json({ error: 'invalid subject' });
        const s = Number(score);
        const t = Number(total);
        if (!Number.isInteger(s) || !Number.isInteger(t)) return res.status(400).json({ error: 'score/total must be integers' });
        if (s < 0 || t <= 0 || s > t) return res.status(400).json({ error: 'invalid score/total' });

        const usersData = await readUsers();
        const user = usersData.users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ error: 'user not found' });

        const resultId = (crypto.randomUUID && crypto.randomUUID()) || crypto.randomBytes(12).toString('hex');
        const result = { id: resultId, subject, date: new Date().toISOString(), score: s, total: t, size: size ? Number(size) : t };
        user.results = user.results || [];
        user.results.push(result);

        // Keep only the last 5 quiz attempts overall (most recent)
        if (Array.isArray(user.results)) {
            // Assume results are append-ordered by time; keep the last 5
            user.results = user.results.slice(-5);
        }

        // Maintain per-subject totals: total correct answers and total questions
        user.totals = user.totals || {}; // structure: { [subject]: { correct: number, questions: number } }
        const subj = subject;
        if (!user.totals[subj]) user.totals[subj] = { correct: 0, questions: 0 };
        user.totals[subj].correct = (user.totals[subj].correct || 0) + s;
        user.totals[subj].questions = (user.totals[subj].questions || 0) + t;

        await queueWrite(() => writeUsers(usersData));
        return res.status(201).json({ ok: true, resultId });
    } catch (e) {
        console.error('post results error', e);
        return res.status(500).json({ error: 'internal' });
    }
});

// GET /results
router.get('/results', authMiddleware, async (req, res) => {
    try {
        const subjectFilter = req.query.subject;
        const usersData = await readUsers();
        const user = usersData.users.find(u => u.id === req.user.id);
        if (!user) return res.status(404).json({ error: 'user not found' });
        let results = user.results || [];
        if (subjectFilter) results = results.filter(r => r.subject === subjectFilter);
        return res.status(200).json({ results });
    } catch (e) {
        console.error('get results error', e);
        return res.status(500).json({ error: 'internal' });
    }
});

module.exports = router;

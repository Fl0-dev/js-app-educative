const { getDb } = require('./_lib/mongo');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { signForUser } = require('./_lib/auth');

module.exports = async function registerHandler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });
    if (typeof username !== 'string' || username.length < 3) return res.status(400).json({ error: 'username too short' });
    if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'password too short' });

    try {
        const db = await getDb();
        const users = db.collection('users');
        const existing = await users.findOne({ username: username });
        if (existing) return res.status(409).json({ error: 'username exists' });

        const passwordHash = await bcrypt.hash(password, 10);
        const id = (crypto.randomUUID && crypto.randomUUID()) || crypto.randomBytes(16).toString('hex');
        const doc = { id, username, passwordHash, createdAt: new Date(), results: [], totals: {} };
        await users.insertOne(doc);
        const token = signForUser({ id: doc.id, username: doc.username });
        return res.status(201).json({ token, user: { id: doc.id, username: doc.username } });
    } catch (e) {
        console.error('register error', e);
        return res.status(500).json({ error: 'internal' });
    }
};

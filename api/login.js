const { getDb } = require('./_lib/mongo');
const bcrypt = require('bcryptjs');
const { signForUser } = require('./_lib/auth');

module.exports = async function loginHandler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { username, password } = req.body || {};
    if (!username || !password) return res.status(400).json({ error: 'username and password required' });

    try {
        const db = await getDb();
        const users = db.collection('users');
        console.log('Looking for user:', username);
        // console.log('users collection:', users);
        const user = await users.findOne({ username: username });
        console.log('Found user:', user);
        if (!user) return res.status(401).json({ error: 'invalid credentials' });

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return res.status(401).json({ error: 'invalid credentials' });

        const token = signForUser({ id: user.id, username: user.username });
        return res.status(200).json({ token, user: { id: user.id, username: user.username } });
    } catch (e) {
        console.error('login error', e);
        return res.status(500).json({ error: 'internal' });
    }
};

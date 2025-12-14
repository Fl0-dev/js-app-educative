const { getDb } = require('./_lib/mongo');
const { verifyToken } = require('./_lib/auth');

module.exports = async function meHandler(req, res) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const payload = verifyToken(req.headers.authorization);
    if (!payload) return res.status(401).json({ error: 'invalid token' });
    try {
        const db = await getDb();
        const users = db.collection('users');
        const user = await users.findOne({ id: payload.id });
        if (!user) return res.status(404).json({ error: 'not found' });
        return res.status(200).json({ user: { id: user.id, username: user.username, totals: user.totals || {} } });
    } catch (e) {
        console.error('me error', e);
        return res.status(500).json({ error: 'internal' });
    }
};

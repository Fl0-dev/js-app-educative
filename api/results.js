const { getDb } = require('./_lib/mongo');
const { verifyToken } = require('./_lib/auth');
const crypto = require('crypto');

module.exports = async function resultsHandler(req, res) {
    const payload = verifyToken(req.headers.authorization);
    if (!payload) return res.status(401).json({ error: 'invalid token' });

    try {
        const db = await getDb();
        const users = db.collection('users');
        const user = await users.findOne({ id: payload.id });
        if (!user) return res.status(404).json({ error: 'user not found' });

        if (req.method === 'POST') {
            const { subject, score, total, size } = req.body || {};
            if (typeof subject !== 'string' || subject.length === 0) return res.status(400).json({ error: 'invalid subject' });
            const s = Number(score);
            const t = Number(total);
            if (!Number.isInteger(s) || !Number.isInteger(t)) return res.status(400).json({ error: 'score/total must be integers' });
            if (s < 0 || t <= 0 || s > t) return res.status(400).json({ error: 'invalid score/total' });

            const resultId = (crypto.randomUUID && crypto.randomUUID()) || crypto.randomBytes(12).toString('hex');
            const result = { id: resultId, subject, date: new Date(), score: s, total: t, size: size ? Number(size) : t };

            // push and keep last 5, increment totals
            const update = {
                $push: { results: { $each: [result], $slice: -5 } },
                $inc: {}
            };
            update.$inc[`totals.${subject}.correct`] = s;
            update.$inc[`totals.${subject}.questions`] = t;

            await users.updateOne({ id: payload.id }, update, { upsert: false });
            return res.status(201).json({ ok: true, resultId });
        }

        if (req.method === 'GET') {
            const subjectFilter = req.query.subject;
            const projection = { results: 1 };
            const fresh = await users.findOne({ id: payload.id }, { projection });
            let results = fresh && fresh.results ? fresh.results : [];
            if (subjectFilter) results = results.filter(r => r.subject === subjectFilter);
            return res.status(200).json({ results });
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (e) {
        console.error('results error', e);
        return res.status(500).json({ error: 'internal' });
    }
};

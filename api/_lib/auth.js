const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

if (!JWT_SECRET) {
    console.warn('Warning: JWT_SECRET is not defined. Tokens will not be secure. Set JWT_SECRET in your environment.');
}

function signForUser(user) {
    // user may be an object from Mongo (with _id) or our own shape (with id)
    const payload = { id: user.id || user._id, username: user.username };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

function verifyToken(authHeader) {
    if (!authHeader || typeof authHeader !== 'string') return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2) return null;
    const token = parts[1].trim();
    if (!token) return null;
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (e) {
        // token malformed or invalid/expired
        return null;
    }
}

module.exports = { signForUser, verifyToken };

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
if (!uri) {
    console.warn('MONGODB_URI is not set');
}

let client;
let clientPromise;

function getClient() {
    if (!clientPromise) {
        client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        clientPromise = client.connect();
    }
    return clientPromise.then(() => client);
}

async function getDb(dbName = null) {
    const c = await getClient();
    return c.db(dbName || undefined);
}

module.exports = { getClient, getDb };

const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const PORT = 3000;
const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'sec_filings_db';
const COLLECTION_NAME = 'item_1_05_breaches';

app.use(cors());

async function fetchFilings() {
    const client = new MongoClient(MONGODB_URI);
    try {
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        
        // Fetch most recent 50 filings
        const filings = await collection.find().sort({ filedAt: -1 }).limit(50).toArray();
        return filings;
    } finally {
        await client.close();
    }
}

// API endpoint to get filings
app.get('/api/filings', async (req, res) => {
    try {
        const filings = await fetchFilings();
        res.json(filings);
    } catch (error) {
        console.error('Error fetching filings:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});

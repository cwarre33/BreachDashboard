const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
require('dotenv').config();
const { exec } = require("child_process");


const app = express();
const PORT = 3000;
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME 
const COLLECTION_NAME = process.env.COLLECTION_NAME;

app.use(cors());
const path = require('path');
app.use(express.static(path.join(__dirname)));


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
app.post("/api/refresh", async (req, res) => {
    exec("node ./sec-data-fetcher.js", (error, stdout, stderr) => {
      if (error) {
        console.error("❌ Error refreshing data:", error.message);
        return res.status(500).json({ success: false, error: error.message });
      }
      console.log("✅ SEC data refreshed");
      console.log("STDOUT:", stdout);
      console.log("STDERR:", stderr);
      res.json({ success: true });
    });
  });
  
  
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
  });
  
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

const axios = require('axios');
const { MongoClient } = require('mongodb');
const { Groq } = require('groq-sdk');
require('dotenv').config(); // Load environment variables from .env file

// ENV variables
const SEC_API_KEY = process.env.SEC_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;
const SEC_API_ENDPOINT = 'https://api.sec-api.io';
const DB_NAME = process.env.DB_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;

// Helper to create GROQ client lazily
function createGroqClient() {
  return new Groq({ apiKey: GROQ_API_KEY });
}

// Fetch SEC filings
async function fetchSecData(fromIndex = 0, size = 50) {
  console.log(`Fetching SEC data from index ${fromIndex}...`);

  const query = {
    query: 'formType:"8-K" AND items:"1.05"',
    from: fromIndex.toString(),
    size: size.toString(),
    sort: [{ filedAt: { order: "desc" } }]
  };

  const response = await axios.post(`${SEC_API_ENDPOINT}?token=${SEC_API_KEY}`, query, {
    headers: { 'Content-Type': 'application/json' }
  });

  return response.data;
}

// Summarize using GROQ
async function generateSummary(filing) {
  const groq = createGroqClient();
  const prompt = `
You are a professional summarizer.
Read this SEC 8-K Item 1.05 cybersecurity breach filing and produce a single, concise paragraph that covers:
- The nature of the breach (e.g., data leak, ransomware)
- Any known impacts (e.g., SSN/PII leaks)
- Actions taken by the company

ONLY return the summary text—do NOT wrap it in JSON or include any labels/fields.

Company: ${filing.companyName}
Filing Date: ${filing.filedAt}
Filing URL: ${filing.secLink}
`;

  const response = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama-3.3-70b-versatile",
    temperature: 0.7,
    max_tokens: 120,
  });

  // Strip any leading/trailing whitespace and return the plain text
  return response.choices?.[0]?.message?.content.trim() || '';
}

// Format filing
function processFilingData(filing) {
  return {
    accessionNo: filing.accessionNo,
    formType: filing.formType,
    filedAt: filing.filedAt,
    ticker: filing.ticker,
    cik: filing.cik,
    companyName: filing.companyName,
    secLink: filing.linkToFilingDetails,
    importedAt: new Date(),
  };
}

// Main logic
async function fetchAndStoreData(batchSize = 50, maxResults = 500) {
  const client = new MongoClient(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
  try {
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("Connected to MongoDB Atlas");

    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);

    let totalProcessed = 0;
    let fromIndex = 0;

    while (totalProcessed < maxResults) {
      const secData = await fetchSecData(fromIndex, batchSize);
      const rawFilings = secData.filings || [];

      if (rawFilings.length === 0) {
        console.log("No more filings to process");
        break;
      }

      for (const filingRaw of rawFilings) {
        const filing = processFilingData(filingRaw);

        console.log(`Generating (or replacing) summary for ${filing.companyName}...`);


        try {
          console.log(`Generating summary for ${filing.companyName}...`);
          const summary = await generateSummary(filing);
          filing.summary = summary;
          console.log(`✅ Summary: ${summary}`);
        } catch (e) {
          console.error(`❌ Failed to summarize ${filing.companyName}:`, e.message);
          continue; // skip this one
        }

        await collection.updateOne(
          { accessionNo: filing.accessionNo },
          { $set: filing },
          { upsert: true }
        );
      }

      totalProcessed += rawFilings.length;
      fromIndex += batchSize;
      console.log(`Total processed: ${totalProcessed}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log("✅ AI-enhanced data fetch and store complete");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

module.exports = {
  fetchSecData,
  generateSummary,
  processFilingData,
  fetchAndStoreData,
};

// Run script only when executed directly
if (require.main === module) {
  fetchAndStoreData(50, 100); // reduce maxResults while testing
}

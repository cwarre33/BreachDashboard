const axios = require('axios');
const { MongoClient } = require('mongodb');
require('dotenv').config(); // Load environment variables from .env file

// Configuration using environment variables
const SEC_API_KEY = process.env.SEC_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI;
const SEC_API_ENDPOINT = 'https://api.sec-api.io';
const DB_NAME = 'sec_filings_db';
const COLLECTION_NAME = 'item_1_05_breaches';

// Create MongoDB client with Atlas connection
const client = new MongoClient(MONGODB_URI, {
  serverSelectionTimeoutMS: 5000
});

// Function to fetch SEC filings data for 8-K Item 1.05
async function fetchSecData(fromIndex = 0, size = 50) {
  try {
    console.log(`Fetching SEC data from index ${fromIndex}...`);
    
    const query = {
      query: "formType:\"8-K\" AND items:\"1.05\"",
      from: fromIndex.toString(),
      size: size.toString(),
      sort: [{ filedAt: { order: "desc" }}]
    };
    
    const response = await axios({
      method: 'post',
      url: `${SEC_API_ENDPOINT}?token=${SEC_API_KEY}`,
      headers: {
        'Content-Type': 'application/json'
      },
      data: query
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching SEC data:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
}

// Function to process filing data (unchanged)
function processFilingData(filing) {
  return {
    accessionNo: filing.accessionNo,
    formType: filing.formType,
    filedAt: filing.filedAt,
    ticker: filing.ticker,
    cik: filing.cik,
    companyName: filing.companyName,
    secLink: filing.linkToFilingDetails,
    importedAt: new Date()
  };
}

// Main function to fetch and store data in MongoDB Atlas
async function fetchAndStoreData(batchSize = 50, maxResults = 500) {
  try {
    await client.connect();
    console.log('Connected to MongoDB Atlas');
    
    const db = client.db(DB_NAME);
    const collection = db.collection(COLLECTION_NAME);
    let totalProcessed = 0;
    let fromIndex = 0;
    
    while (totalProcessed < maxResults) {
      const secData = await fetchSecData(fromIndex, batchSize);
      
      if (!secData.filings || secData.filings.length === 0) {
        console.log('No more filings to process');
        break;
      }
      
      const filings = secData.filings.map(processFilingData);
      
      if (filings.length > 0) {
        const operations = filings.map(filing => ({
          updateOne: {
            filter: { accessionNo: filing.accessionNo },
            update: { $set: filing },
            upsert: true
          }
        }));
        
        const result = await collection.bulkWrite(operations);
        console.log(`Bulk write results: ${JSON.stringify(result)}`);
      }
      
      totalProcessed += filings.length;
      fromIndex += batchSize;
      console.log(`Total processed: ${totalProcessed}`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('Data fetch and store complete');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
    console.log('MongoDB connection closed');
  }
}

// Execute data fetch for 8-K Item 1.05 filings
fetchAndStoreData(50, 500);
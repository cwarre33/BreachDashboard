# SEC Breach Dashboard 🛡️

A full-stack web application that visualizes real-time cybersecurity breach filings submitted to the SEC (8-K Item 1.05) and provides AI-powered summaries for easy analysis.

## 🔍 Overview
The SEC Breach Dashboard allows users to:
- Monitor recent security breach disclosures filed with the SEC
- Interact with visual trends and graphs
- Generate natural-language AI summaries of each breach filing
- Gain insights into corporate breach events in real-time

## 🚀 Live Deployment
**Hosted on AWS EC2** — (https://breachdashboard.online/)

## 🧠 Key Features
- 🔄 Real-time data from EDGAR API (8-K Item 1.05 filings)
- 📊 Data visualizations of breach timelines and affected companies
- 🤖 AI-powered summaries using Groq LLM
- 🧭 User-friendly interface for breach exploration

## 🛠️ Tech Stack
**Frontend:**
- React.js
- Chart.js for dynamic visualizations

**Backend:**
- Node.js + Express
- MongoDB (Atlas)
- Mongoose for schema modeling
- EDGAR API integration
- Groq API for LLM-generated summaries

**Infrastructure:**
- AWS EC2 instance
- MongoDB Atlas cluster
- GitHub for version control

## 📁 Folder Structure
```
.
├── client/               # React frontend
├── server/               # Express backend
│   ├── routes/
│   ├── models/
│   ├── controllers/
│   └── services/
├── public/               # Static files
├── .env                  # Environment variables (not pushed)
└── README.md
```

## 🧪 How to Run Locally
1. Clone the repo:
```bash
git clone https://github.com/cwarre33/BreachDashboard.git
cd BreachDashboard
```

2. Install dependencies:
```bash
npm install
cd client && npm install
```

3. Add `.env` file with:
```
MONGO_URI=your_mongodb_uri
GROQ_API_KEY=your_groq_api_key
```

4. Run the server:
```bash
npm run dev
```

5. Visit `http://localhost:3000`


## 👥 Contributors
- Cameron Warren [@cwarre33](https://github.com/cwarre33)
- Charles [@CharlesGitHub](#)
- James [@JamesGitHub](#)
- Tolu [@ToluGitHub](#)

## 📄 License
MIT License

---

_This project was developed as part of our capstone course at UNC Charlotte (ITCS 4155: Software Engineering)._

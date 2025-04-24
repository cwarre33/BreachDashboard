// Global variable to store our data
let secFilingsData = []

async function fetchData() {
  try {
    // For development, we'll use a mock response if the API is not available
    let data
    try {
      const response = await fetch("http://localhost:3000/api/filings")
      data = await response.json()
    } catch (error) {
      console.warn("Could not fetch from API, using mock data")
      // Mock data for development
      data = generateMockData(50)
    }
    document.getElementById("last-updated").textContent = `Last updated: ${new Date().toLocaleString()}`;

    secFilingsData = data
    populateTable(data)
    renderBreachVolumeChart(data);
    renderTopTickersChart(data); 
    renderBreachTypeChart(data);
    renderBreachTypeOverTimeChart(data);





    // Dispatch an event to notify the Three.js visualization that data is ready
    const dataReadyEvent = new CustomEvent("dataReady", { detail: { data } })
    document.dispatchEvent(dataReadyEvent)
  } catch (error) {
    console.error("Error fetching data:", error)
  }
}

function populateTable(data) {
  const tableBody = document.getElementById("breach-table-body");
  tableBody.innerHTML = "";

  data.forEach((filing, index) => {
    // --- enhanced parsing logic ---
    let summaryText = "No summary available";
    const raw = filing.summary;

    if (raw) {
      // if it's an object, pull .summary directly
      if (typeof raw === "object" && raw.summary) {
        summaryText = raw.summary;
      }
      // if it's a string, check if it's JSON
      else if (typeof raw === "string") {
        const trimmed = raw.trim();
        if (trimmed.startsWith("{")) {
          try {
            const obj = JSON.parse(raw);
            if (obj.summary) summaryText = obj.summary;
          } catch (e) {
            // malformed JSON, fall back to raw
            summaryText = raw;
          }
        } else {
          // plain text summary
          summaryText = raw;
        }
      }
    }
    // -------------------------

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${filing.companyName}</td>
      <td>${new Date(filing.filedAt).toLocaleDateString()}</td>
      <td>${filing.ticker || "N/A"}</td>
      <td>${summaryText}</td>
      <td><a href="${filing.secLink}" target="_blank">View</a></td>
    `;

    row.addEventListener("click", () => {
      document
        .querySelectorAll("#breach-table-body tr")
        .forEach(r => r.classList.remove("selected"));
      row.classList.add("selected");

      document.dispatchEvent(new CustomEvent("selectCompany", {
        detail: { companyIndex: index, company: filing },
      }));
    });

    tableBody.appendChild(row);
  });
}









// Function to filter the table based on search input
function filterTable(searchTerm) {
  const filteredData = secFilingsData.filter(
    (filing) =>
      filing.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (filing.ticker && filing.ticker.toLowerCase().includes(searchTerm.toLowerCase())) ||
      filing.cik.toString().includes(searchTerm),
  )

  populateTable(filteredData)

  // Notify the visualization about the filter
  const filterEvent = new CustomEvent("filterData", {
    detail: { filteredData, searchTerm },
  })
  document.dispatchEvent(filterEvent)
}

// Generate mock data for development
function generateMockData(count) {
  const companies = [
    "Acme Corp",
    "TechGiant Inc",
    "Global Systems",
    "DataSafe Solutions",
    "SecureNet",
    "CyberShield",
    "InfoGuard",
    "DigitalFortress",
    "ByteDefenders",
    "NetSentry",
    "CloudSecure",
    "PrivacyWall",
  ]

  const mockData = []

  for (let i = 0; i < count; i++) {
    const companyIndex = Math.floor(Math.random() * companies.length)
    const daysAgo = Math.floor(Math.random() * 365)
    const filingDate = new Date()
    filingDate.setDate(filingDate.getDate() - daysAgo)

    mockData.push({
      companyName: companies[companyIndex],
      filedAt: filingDate.toISOString(),
      ticker: `${companies[companyIndex].substring(0, 4).toUpperCase()}`,
      secLink: "https://www.sec.gov/edgar/search/",
      cik: Math.floor(1000000 + Math.random() * 9000000),
      breachSeverity: Math.floor(Math.random() * 3) + 1, // 1-3 severity
    })
  }

  return mockData
}

// Set up search functionality
document.addEventListener("DOMContentLoaded", () => {
  fetchData()

  const searchInput = document.getElementById("search-input")
  searchInput.addEventListener("input", (e) => {
    filterTable(e.target.value)
  })

  // Toggle view button functionality
  const viewToggleBtn = document.getElementById("view-toggle")
  viewToggleBtn.addEventListener("click", () => {
    document.dispatchEvent(new CustomEvent("toggleView"))
  })
})

// REFRESH DATA BUTTON
document.getElementById("refresh-data-btn").addEventListener("click", async () => {
  try {
    const btn = document.getElementById("refresh-data-btn");
    btn.textContent = "⏳ Refreshing...";
    btn.disabled = true;

    // Call your backend to re-run the fetcher
    const res = await fetch("/api/refresh", { method: "POST" });
    const result = await res.json();

    if (result.success) {
      await fetchData(); // reload UI with new data
      btn.textContent = "✅ Refreshed!";
    } else {
      console.error(result.error);
      btn.textContent = "⚠️ Failed!";
    }
  } catch (err) {
    console.error(err);
    alert("Error refreshing data.");
  } finally {
    setTimeout(() => {
      btn.textContent = "🔄 Refresh Data";
      btn.disabled = false;
    }, 2000);
  }
});

function renderBreachVolumeChart(data) {
  const ctx = document.getElementById("chart-volume").getContext("2d");

  const dateCounts = {};

  data.forEach((filing) => {
    const date = new Date(filing.filedAt);
    const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    dateCounts[label] = (dateCounts[label] || 0) + 1;
  });

  const sortedLabels = Object.keys(dateCounts).sort();
  const counts = sortedLabels.map((label) => dateCounts[label]);

  new Chart(ctx, {
    type: "line",
    data: {
      labels: sortedLabels,
      datasets: [{
        label: "Breach Filings Per Month",
        data: counts,
        borderColor: "#3d5afe",
        backgroundColor: "rgba(61, 90, 254, 0.2)",
        fill: true,
        tension: 0.2,
        pointRadius: 3,
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: { callbacks: {
          label: ctx => `Filings: ${ctx.raw}`
        }}
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Number of Breaches" }
        },
        x: {
          title: { display: true, text: "Month" }
        }
      }
    }
  });
}
function renderTopTickersChart(data) {
  const ctx = document.getElementById("chart-2").getContext("2d");

  const tickerCounts = {};

  data.forEach((filing) => {
    const ticker = filing.ticker || "N/A";
    tickerCounts[ticker] = (tickerCounts[ticker] || 0) + 1;
  });

  const sortedTickers = Object.entries(tickerCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const labels = sortedTickers.map(([ticker]) => ticker);
  const values = sortedTickers.map(([_, count]) => count);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Breach Filings",
        data: values,
        backgroundColor: "#4b7bec",
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        title: {
          display: true,
          color: "#e0e6f0",
          font: {
            size: 16,
            weight: 'bold'
          },
          padding: {
            top: 10,
            bottom: 20
          }
        },
        tooltip: {
          callbacks: {
            label: ctx => `Filings: ${ctx.raw}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Filings" },
          ticks: { precision: 0 }
        },
        x: {
          ticks: { autoSkip: false },
          title: { display: true, text: "Stock Ticker" }
        }
      }
    }
    
  });
}
function renderBreachTypeChart(data) {
  const ctx = document.getElementById("chart-3").getContext("2d");

  const tags = {
    "Ransomware": /ransomware/i,
    "Phishing": /phishing/i,
    "Unauthorized Access": /unauthorized|unusual access|intrusion/i,
    "Third-Party": /vendor|third[-\s]?party/i,
    "SSN / PII Leak": /social security|ssn|personally identifiable/i,
    "Internal Error": /misconfigured|employee error|mistake/i
  };

  const counts = Object.fromEntries(Object.keys(tags).map(tag => [tag, 0]));

  data.forEach((filing) => {
    const summary = filing.summary || "";
    for (const [label, regex] of Object.entries(tags)) {
      if (regex.test(summary)) {
        counts[label]++;
      }
    }
  });

  const labels = Object.keys(counts);
  const values = labels.map(label => counts[label]);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Detected Breach Type Keywords",
        data: values,
        backgroundColor: "#4b7bec",
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 },
          title: { display: true, text: "Occurrences" }
        },
        x: {
          ticks: { autoSkip: false },
          title: { display: true, text: "Breach Category" }
        }
      }
    }
  });
}
function renderBreachTypeOverTimeChart(data) {
  const ctx = document.getElementById("chart-4").getContext("2d");

  const tags = {
    "Ransomware": /ransomware/i,
    "Phishing": /phishing/i,
    "Unauthorized Access": /unauthorized|unusual access|intrusion/i,
    "Third-Party": /vendor|third[-\s]?party/i,
    "SSN / PII Leak": /social security|ssn|personally identifiable/i,
    "Internal Error": /misconfigured|employee error|mistake/i
  };

  // Build a map like: { '2024-03': { Ransomware: 2, Phishing: 1, ... } }
  const breakdown = {};

  data.forEach(filing => {
    const summary = filing.summary || "";
    const date = new Date(filing.filedAt);
    const label = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!breakdown[label]) breakdown[label] = {};
    for (const type in tags) {
      if (tags[type].test(summary)) {
        breakdown[label][type] = (breakdown[label][type] || 0) + 1;
      }
    }
  });

  const timeLabels = Object.keys(breakdown).sort();
  const datasets = Object.keys(tags).map(type => ({
    label: type,
    data: timeLabels.map(label => breakdown[label][type] || 0),
    borderWidth: 2,
    fill: true
  }));

  new Chart(ctx, {
    type: "line",
    data: {
      labels: timeLabels,
      datasets: datasets.map((set, i) => ({
        ...set,
        borderColor: `hsl(${i * 60}, 70%, 60%)`,
        backgroundColor: `hsla(${i * 60}, 70%, 60%, 0.2)`
      }))
    },
    options: {
      responsive: true,
      plugins: {
        
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.dataset.label}: ${ctx.raw}`
          }
        }
      },
      interaction: {
        mode: "index",
        intersect: false
      },
      scales: {
        y: {
          beginAtZero: true,
          title: { display: true, text: "Breach Count" }
        },
        x: {
          title: { display: true, text: "Month" }
        }
      }
    }
  });
}

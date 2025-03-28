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

    secFilingsData = data
    populateTable(data)

    // Dispatch an event to notify the Three.js visualization that data is ready
    const dataReadyEvent = new CustomEvent("dataReady", { detail: { data } })
    document.dispatchEvent(dataReadyEvent)
  } catch (error) {
    console.error("Error fetching data:", error)
  }
}

function populateTable(data) {
  const tableBody = document.getElementById("breach-table-body")
  tableBody.innerHTML = ""

  data.forEach((filing, index) => {
    const row = document.createElement("tr")
    row.dataset.index = index

    row.innerHTML = `
            <td>${filing.companyName}</td>
            <td>${new Date(filing.filedAt).toLocaleDateString()}</td>
            <td>${filing.ticker || "N/A"}</td>
            <td><a href="${filing.secLink}" target="_blank" rel="noopener noreferrer">View Filing</a></td>
            <td>${filing.cik}</td>
        `

    row.addEventListener("click", () => {
      // Remove selected class from all rows
      document.querySelectorAll("#breach-table-body tr").forEach((r) => {
        r.classList.remove("selected")
      })

      // Add selected class to this row
      row.classList.add("selected")

      // Dispatch event to highlight the corresponding node in 3D visualization
      const selectCompanyEvent = new CustomEvent("selectCompany", {
        detail: { companyIndex: index, company: filing },
      })
      document.dispatchEvent(selectCompanyEvent)
    })

    tableBody.appendChild(row)
  })
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



async function fetchData() {
    try {
        const response = await fetch('http://localhost:3000/api/filings');
        const data = await response.json();
        populateTable(data);
        updateCharts(data);
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function populateTable(data) {
    const tableBody = document.getElementById('breach-table-body');
    tableBody.innerHTML = '';

    data.forEach(filing => {
        const row = `<tr>
            <td>${filing.companyName}</td>
            <td>${new Date(filing.filedAt).toLocaleDateString()}</td>
            <td>${filing.ticker}</td>
            <td>${filing.secLink}</td>
            <td>${filing.cik}</td>
        </tr>`;
        tableBody.innerHTML += row;
    });
}

// Call fetchData when the page loads
document.addEventListener('DOMContentLoaded', fetchData);

// Your updated Google Sheets API key and Spreadsheet ID
const API_KEY = 'AIzaSyD6eAikKznWps9K8GcflqPy03-L7KTUaWE'; // Your API Key
const SPREADSHEET_ID = '1bZIxAmb2-E3naVHbggvAs4nOAUi0J6XIcGMyU2Bmc5w'; // Your Spreadsheet ID
const RANGE = 'Drip & COTD!A12:S'; // Updated range to include Column S (S12:S)


// Function to initialize the Google API client
function initClient() {
    console.log("Initializing Google API client...");
    gapi.load('client', () => {
        gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
        }).then(() => {
            console.log("Google API client initialized successfully.");
            getData(); // Fetch data initially
        }).catch((error) => {
            console.error('Error initializing Google API client:', error);
        });
    });
}

// Function to fetch data from Google Sheets
function getData() {
    console.log("Fetching data from Google Sheets...");
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: RANGE,
    }).then((response) => {
        const data = response.result.values;
        console.log("Raw Data from Google Sheets: ", data); // Log raw data from Google Sheets

        if (data && data.length > 0) {
            console.log("Data retrieved:", data);
            const filteredData = filterDataByDateAndBranch(data);
            console.log("Filtered Data (after applying date and الفرع filter): ", filteredData); // Log filtered data
            displayData(filteredData); // Display filtered data
        } else {
            console.log('No data found.');
            $('#dashboard').html('<p>No data found in the specified range.</p>');
        }
    }).catch((error) => {
        console.error('Error fetching data:', error);
    });
}

// Function to filter data by date range and "الفرع" (default last 30 days and "الخبر 1.3")
function filterDataByDateAndBranch(data) {
    const startDateInput = document.getElementById('startDate') ? document.getElementById('startDate').value : null;
    const endDateInput = document.getElementById('endDate') ? document.getElementById('endDate').value : null;
    
    const today = new Date();
    const defaultStartDate = new Date(today.setDate(today.getDate() - 30)); // 30 days ago
    const startDate = startDateInput ? new Date(startDateInput) : defaultStartDate;
    const endDate = endDateInput ? new Date(endDateInput) : new Date(); // Default to today

    console.log(`Filtering data between ${startDate} and ${endDate}`);

    // Filter by date and "الفرع" containing "الخبر 1.3"
    const filteredData = data.filter(row => {
        const rowDateStr = row[0]; // Assuming column A contains the date as a string
        const rowDate = parseDate(rowDateStr); // Parse the date
        const branch = row[10] || ''; // Assuming column K contains الفرع
        return rowDate >= startDate && rowDate <= endDate && branch.includes('الدمام 2.1');
    });

    console.log("Filtered Data after date and الفرع filtering:", filteredData); // Log the filtered data
    return filteredData;
}

// Helper function to parse the date from Google Sheets (adjust this to your format)
function parseDate(dateStr) {
    const dateParts = dateStr.split('/'); // Adjust this based on the actual date format in your sheet
    // Assuming the format is "MM/DD/YYYY" or "DD/MM/YYYY"
    if (dateParts.length === 3) {
        const month = parseInt(dateParts[0], 10) - 1; // JavaScript months are 0-based
        const day = parseInt(dateParts[1], 10);
        const year = parseInt(dateParts[2], 10);
        return new Date(year, month, day);
    }
    return new Date(dateStr); // Fallback for other date formats
}

// Function to sort data by date (newest to oldest)
function sortDataByDate(data) {
    return data.sort((a, b) => {
        const dateA = parseDate(a[0]); // Assuming column A is the date
        const dateB = parseDate(b[0]);
        return dateB - dateA; // Sort by date in descending order (newest first)
    });
}

// Function to handle checkbox update
function updateCheckbox(row, value) {
    const rowNumber = row + 12; // Adjust to match the row in the Google Sheet (start from S12)
    const range = `Drip & COTD!S${rowNumber}`;

    gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: {
            values: [[value ? 'TRUE' : 'FALSE']]
        }
    }).then(response => {
        console.log(`Checkbox updated for row ${rowNumber}:`, response);
    }).catch(error => {
        console.error('Error updating checkbox:', error);
    });
}

// Function to display the filtered and sorted data (with editable checkboxes)
function displayData(data) {
    console.log("Displaying data...");
    // Sort the data by date (newest first)
    const sortedData = sortDataByDate(data);
    
    let html = '<table border="1" style="direction: rtl; text-align: center;"><tr><th>التاريخ</th><th>المحصول </th><th>المحصول</th><th>نسبة التركيز TDS%</th><th>الفرع</th><th>الطحنة</th><th>التركيز المناسب TDS%</th><th>الاجراء</th><th>Column S (Checkbox)</th></tr>'; // Added "Column S"

    sortedData.forEach((row, index) => {
        const columnQ = row[16] || ''; // Column Q value (text)
        const columnS = row[18] === 'TRUE' ? true : false; // Column S (checkbox value)
        const columnK = row[10] || ''; // Column K value (filtered for "الخبر 1.3")
        
        // Apply conditional formatting based on values in Column Q with new colors
        let color = '';
        if (columnQ.includes('تنعيم، خروج عالي عن المستهدف') || columnQ.includes('تخشين، خروج عالي عن المستهدف')) {
            color = '#f09c9c'; // Updated red color
        } else if (columnQ.includes('تخشين، خروج بسيط عن المستهدف') || columnQ.includes('تنعيم، خروج بسيط عن المستهدف')) {
            color = '#fce8b2'; // Updated yellow color
        } else if (columnQ.includes('ضمن المدى المستهدف للمحصول')) {
            color = '#b7e1cd'; // Updated green color
        }

        // Add rows to the table
        html += `<tr>
                    <td>${row[0] || ''}</td>
                    <td>${row[1] || ''}</td>
                    <td>${row[3] || ''}</td> <!-- Column D: المحصول -->
                    <td>${row[6] || ''}</td> <!-- Column G: نسبة التركيز TDS% -->
                    <td>${columnK || ''}</td> <!-- Column K: الفرع -->
                    <td>${row[11] || ''}</td> <!-- Column L: الطحنة -->
                    <td>${row[13] || ''}</td> <!-- Column N: التركيز المناسب TDS% -->
                    <td style="background-color:${color}">${columnQ}</td> <!-- Column Q: الاجراء -->
                    <td><input type="checkbox" ${columnS ? 'checked' : ''} onchange="updateCheckbox(${index}, this.checked)"></td> <!-- Editable checkbox for Column S -->
                </tr>`;
    });

    html += '</table>';
    $('#dashboard').html(html);
    console.log("Data displayed successfully.");
}

// Initialize the client when the document is ready
$(document).ready(function() {
    console.log("Document is ready. Loading Google API client...");
    gapi.load('client', initClient); // Load the API client and initialize it

    // Set up event listener for the "Apply Filter" button
    const applyFilterButton = document.getElementById('applyFilter');
    if (applyFilterButton) {
        applyFilterButton.addEventListener('click', () => {
            getData(); // Re-fetch and filter the data based on selected dates
        });
    }
});

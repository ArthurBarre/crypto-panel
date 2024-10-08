const express = require('express');
const fs = require('fs');
const Papa = require('papaparse');
// const fetchAndSaveMarketCaps = require('./generateMaketCaps'); // Ensure the correct path

const app = express();
const port = 8084;

// Serve static files (CSS/JS)
app.use(express.static('public'));

// Route to serve the index.html file
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html'); // Adjust the path if necessary
});

// Route to fetch market cap data
// app.post('/fetch-market-caps', async (req, res) => {
//   try {
//     await fetchAndSaveMarketCaps();  // Call the function to fetch and save data
//     res.status(200).send('Data has been updated successfully.');
//   } catch (error) {
//     res.status(500).send('Error updating data.');
//   }
// });

// Route to read and parse CSV files
app.get('/data', (req, res) => {
  const cryptoData = [];
  const marketCapData = [];

  // Read and parse crypto.csv
  fs.readFile('./crypto.csv', 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading crypto.csv');
    }
    Papa.parse(data, {
      header: false,
      complete: (results) => {
        results.data.forEach(row => {
          // Vérifiez les indices ici
          cryptoData.push({
            id: row[0],
            timestamp: row[1],
            cryptocurrency: row[11], // Changez ici si nécessaire
            market: row[3],
            link: row[4],
            price: row[6],
            marketCap: row[8],
            picture: row[13],
          });
        });

        // Read and parse marketCapsWithTimestamp.csv
        fs.readFile('./marketCapsWithTimestamp.csv', 'utf8', (err, data) => {
          if (err) {
            return res.status(500).send('Error reading marketCapsWithTimestamp.csv');
          }
          Papa.parse(data, {
            header: false,
            complete: (results) => {
              results.data.forEach(row => {
                marketCapData.push({
                  id: row[0],
                  timestamp: row[1],
                  cryptocurrency: row[2],
                  marketCap: row[3]
                });
              });

              // Send combined data as response
              res.json({ cryptoData, marketCapData });
              console.log(cryptoData);
            }
          });
        });
      }
    });
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

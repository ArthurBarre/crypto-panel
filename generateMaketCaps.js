const axios = require('axios');
const fs = require('fs');
const path = require('path');
const csvParser = require('csv-parser');

// Liste des cryptos avec leurs symboles
const cryptos = [
  "SPX6900", "SMURFCAT", "PONKE", "GIGA", "SKBDI", "WYAC", "BCAT", "UWU", "MINION",
  "KEKEC", "CHUD", "Harambe", "JOE", "CHONKY", "NPC", "HPOS10I", "ILY", "OIIAOIIA",
  "TAO", "BRAINLET", "ZYN", "FET", "MONK", "TARD", "CPOOL", "YAKUB", "XD", "PARCL",
  "SIGMA", "BOBO", "MINI", "HAMMY", "ACAT", "NUBCAT", "CHAD", "HUHCAT", "LOCKIN",
  "PUPS", "HOBA", "ELGATO", "WZRD", "LMI", "RETARDIO", "CSI", "SNAP", "AURA", "SSEC",
  "SPEED", "MICHI", "KEYCAT", "BRO", "MUMU", "SCF", "NASDAQ420", "MAGA hat", "TRIANGLE",
  "GLORP", "REALIO", "BIAO (eth)", "CHEESEBALL", "NUNET", "NPI", "COK", "APU", "KIETH",
  "WOJAK", "SHARKCAT", "FUCKTARD", "ALBEMARLE", "FIC", "CMM", "BB", "HORSEMEAT", "DJX"
];

// Fonction pour récupérer les market cap d'un token
async function getMarketCap(symbol) {
  try {
    const url = `https://api.dexscreener.io/latest/dex/search/?q=${symbol}`;
    const response = await axios.get(url);

    if (response.data && response.data.pairs && response.data.pairs.length > 0) {
      const tokenData = response.data.pairs[0];
      const marketCap = tokenData.fdv || 'N/A';
      return { symbol, marketCap };
    } else {
      console.log(`Aucune donnée trouvée pour ${symbol}`);
      return { symbol, marketCap: 'N/A' };
    }
  } catch (error) {
    console.error(`Erreur pour ${symbol}:`, error.message);
    return { symbol, marketCap: 'Erreur' };
  }
}

// Fonction pour récupérer les données complètes d'un token
async function getFullTokenData(symbol) {
  try {
    const url = `https://api.dexscreener.io/latest/dex/search/?q=${symbol}`;
    const response = await axios.get(url);
    if (response.data && response.data.pairs && response.data.pairs.length > 0) {
      const tokenData = response.data.pairs[0];

      return {
        chainId: tokenData.chainId,
        dexId: tokenData.dexId,
        url: tokenData.url,
        pairAddress: tokenData.pairAddress,
        labels: tokenData.labels,
        priceNative: tokenData.priceNative,
        priceUsd: tokenData.priceUsd,
        marketCap: tokenData.marketCap,
        fdv: tokenData.fdv,
        baseTokenName: tokenData.baseToken.name, // Ajout du nom du token de base
        baseTokenSymbol: tokenData.baseToken.symbol, // Ajout du symbole du token de base
        picture: tokenData.info.imageUrl
      };
    } else {
      console.log(`Aucune donnée trouvée pour ${symbol}`);
      return null;
    }
  } catch (error) {
    console.error(`Erreur pour ${symbol}:`, error.message);
    return null;
  }
}

// Fonction pour lire le fichier CSV et récupérer le dernier ID
function getLastId(csvPath) {
  return new Promise((resolve, reject) => {
    let lastId = 0;

    if (!fs.existsSync(csvPath)) {
      resolve(lastId);
      return;
    }

    fs.createReadStream(csvPath)
      .pipe(csvParser())
      .on('data', (row) => {
        if (row.ID) {
          lastId = Math.max(lastId, parseInt(row.ID, 10));
        }
      })
      .on('end', () => {
        resolve(lastId);
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

// Fonction principale pour récupérer les market caps et les ajouter au fichier CSV
async function fetchAndSaveMarketCaps() {
  const timestampedCsvPath = path.join(__dirname, 'marketCapsWithTimestamp.csv');
  const cryptoCsvPath = path.join(__dirname, 'crypto.csv');
  let lastId = await getLastId(timestampedCsvPath);

  const timestampedResults = [];

  for (let crypto of cryptos) {
    console.log(`Traitement de la cryptomonnaie: ${crypto}`); // Ajout d'un log pour le débogage
    const data = await getMarketCap(crypto);
    const fullData = await getFullTokenData(crypto);

    // Vérifiez si les données sont valides
    if (!data || !fullData) {
      console.log(`Données manquantes pour ${crypto}`); // Log si les données sont manquantes
      continue; // Passer à la prochaine cryptomonnaie
    }

    const timestamp = new Date().toISOString();
    lastId += 1;

    timestampedResults.push({ id: lastId, timestamp, ...data, ...fullData });

    // Ajouter les nouvelles lignes au fichier crypto.csv
    if (fullData) {
      const labelsString = fullData.labels ? fullData.labels.join(';') : '';
      const cryptoCsvContent = [
        lastId,
        timestamp,
        fullData.chainId,
        fullData.dexId,
        fullData.url,
        fullData.pairAddress,
        fullData.priceNative,
        fullData.priceUsd,
        fullData.marketCap,
        fullData.fdv,
        labelsString,
        fullData.baseTokenName, // Ajouté pour inclure le nom du token de base
        fullData.baseTokenSymbol, // Ajouté pour inclure le symbole du token de base
        fullData.picture // Ajouté pour inclure l'image
      ].join(',') + '\n';

      fs.appendFileSync(cryptoCsvPath, cryptoCsvContent);
    }
  }

  // Générer le contenu du CSV
  const timestampedCsvContent = timestampedResults.map(result => [
    result.id,
    result.timestamp,
    result.symbol,
    result.marketCap
  ].join(',')).join('\n');

  // Si le fichier n'existe pas, on ajoute l'entête
  if (!fs.existsSync(timestampedCsvPath)) {
    const header = 'ID,Timestamp,Symbol,Market Cap\n';
    fs.writeFileSync(timestampedCsvPath, header);
  }

  // Ajouter les nouvelles lignes au fichier CSV
  fs.appendFileSync(timestampedCsvPath, '\n' + timestampedCsvContent);
  console.log(`Nouvelles données ajoutées à ${timestampedCsvPath}`);
}

// Exécuter la fonction
fetchAndSaveMarketCaps();

// Exporter la fonction pour qu'elle puisse être utilisée ailleurs
module.exports = fetchAndSaveMarketCaps;
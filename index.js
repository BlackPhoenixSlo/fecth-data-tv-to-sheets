require('dotenv').config();
const { google } = require('googleapis');
const TradingView = require('./main'); // Adjust the path as needed
const { appendAllDataFromJson_big } = require('./googleSheetsUtils');
const cron = require('node-cron');
require('punycode/')
const calculateCorrelations = require('./ethbtccorr');

const spreadsheetId = "1SZwDpZO7rvLrijKq9dtgdOP4tffr-KzhQB1JsPXBj8I";
const id = "whv5betgotone8n4lfwnaco9xq15dl7t";
const certificate = "v1:Bk/ZvaAmuR48QoWNbGrOeTdM9CTL+CUngWzYXUF0jvQ=";
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const markets = ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT', 'BINANCE:ETHBTC'];

async function getAuthToken() {
    const auth = new google.auth.GoogleAuth({ scopes: SCOPES });
    const authToken = await auth.getClient();
    return authToken;
}

async function fetchData(market, timeframe) {
    const client = new TradingView.Client({ token: id, signature: certificate });
    const chart = new client.Session.Chart();
    chart.setMarket(market, {
        timeframe: timeframe,
        range: 1,
        to: Math.round(Date.now() / 1000)
    });
    console.log("fetchdata ... timeframe", timeframe)

    return new Promise((resolve, reject) => {
        TradingView.getIndicator('USER;fa4099d3a752474a95e79b2d9186b804').then((indic) => {
            const study = new chart.Study(indic);
            study.onUpdate(() => {
                console.log("data ... timeframe", study.periods[0].Plot_5)

                resolve(study.periods);
                client.end();
            });
        }).catch(reject);
    });
}

function processDataForTimeframes(market, data1D, data2D, data3D, data4D, data5D, data6D, dataW, dataM) {
    let alignedData = {};
    let marketName = market.split(':')[1]; // Extracts the part after 'BINANCE:'

    let latestData = data1D[0]; // Assuming the latest data is the first element in the array
    let monthlyPosition = dataM.length > 0 ? dataM[0].position : null; // Assuming the first entry in dataM is the latest

    alignedData[marketName + '_unix'] = latestData.$time;
    alignedData[marketName + '_time'] = new Date(latestData.$time * 1000).toLocaleString();
    alignedData[marketName + '_1Dposition'] = latestData.position;
    alignedData[marketName + '_2Dposition'] = findClosestData(latestData, data2D).position;
    alignedData[marketName + '_3Dposition'] = findClosestData(latestData, data3D).position;
    alignedData[marketName + '_4Dposition'] = findClosestData(latestData, data4D).position;
    alignedData[marketName + '_5Dposition'] = findClosestData(latestData, data5D).position;
    alignedData[marketName + '_6Dposition'] = findClosestData(latestData, data6D).position;
    alignedData[marketName + '_Wposition'] = findClosestData(latestData, dataW).position;
    alignedData[marketName + '_Mposition'] = monthlyPosition;
    alignedData[marketName + '_closeprice'] = latestData.ClosePrice;

    return alignedData;
}

function findClosestData(day, timeframeData) {
  // Assuming timeframeData is sorted by time, find the closest entry to 'day'
  let closest = timeframeData[0];
  let minDiff = Math.abs(day.$time - closest.$time);

  for (let entry of timeframeData) {
    let diff = Math.abs(day.$time - entry.$time);
    if (diff < minDiff) {
      minDiff = diff;
      closest = entry;
    }
  }

  return closest;
}


async function exportAllMarketData() {
  try {
      const auth = await getAuthToken();
      let allProcessedData = {};

      for (let market of markets) {
        const data1D = await fetchData(market, '1D');
        const data2D = await fetchData(market, '2D');
        const data3D = await fetchData(market, '3D');
        const data4D = await fetchData(market, '4D');
        const data5D = await fetchData(market, '5D');
        const data6D = await fetchData(market, '6D');
        const dataW = await fetchData(market, 'W');
        const dataM = await fetchData(market, '1M');
          // ... existing code to fetch and process data ...

          const processedData = processDataForTimeframes(market, data1D, data2D, data3D, data4D, data5D, data6D, dataW, dataM);
          Object.assign(allProcessedData, processedData);
      }

      // Prepare data for Google Sheets
      const headers = Object.keys(allProcessedData);
      const values = Object.values(allProcessedData);

      const sheetData = [headers].concat([values]); // Correct structure: array of arrays

      const sheetTitle = 'CombinedMarketData';
      await appendAllDataFromJson_big(auth, spreadsheetId, sheetTitle, sheetData);

      console.log('Data from all markets exported successfully to Google Sheets with correct headers.');

  } catch (error) {
      console.error('Error in exportAllMarketData:', error);
  }
}

const axios = require('axios');

async function getMarketCap() {
    const apiKey = 'fd6113eb-8ae0-4d0e-84bb-6b5a03a95201';
    const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest';
    const symbols = 'BTC,ETH'; // Symbols for Bitcoin and Ethereum

    try {
        const response = await axios.get(url, {
            headers: {
                'X-CMC_PRO_API_KEY': apiKey
            },
            params: {
                symbol: symbols
            }
        });

        const btcMarketCap = response.data.data.BTC.quote.USD.market_cap;
        const ethMarketCap = response.data.data.ETH.quote.USD.market_cap;

        return { BTC: btcMarketCap, ETH: ethMarketCap };
    } catch (error) {
        console.error('Error fetching data:', error);
        return { BTC: null, ETH: null }; // Return null if there is an error
    }
}

function abs(x){
    if( x < 0 ) {
        return -x;
    
    }
    return x
}

// Integration with exportAllMarketDataWithMarketCap
async function exportAllMarketDataWithMarketCap() {
    // ... other required imports and function definitions ...

    try {
        const auth = await getAuthToken();
        let allProcessedData = {};

        
  
        for (let market of markets) {
          const data1D = await fetchData(market, '1D');
          const data2D = await fetchData(market, '2D');
          const data3D = await fetchData(market, '3D');
          const data4D = await fetchData(market, '4D');
          const data5D = await fetchData(market, '5D');
          const data6D = await fetchData(market, '6D');
          const dataW = await fetchData(market, 'W');
          const dataM = await fetchData(market, '1M');
            // ... existing code to fetch and process data ...
  
            const processedData = processDataForTimeframes(market, data1D, data2D, data3D, data4D, data5D, data6D, dataW, dataM);
            Object.assign(allProcessedData, processedData);
        }
  

        // Fetch market cap data for BTC and ETH
        const marketCapData = await getMarketCap();
        allProcessedData['BTC_MarketCap'] = marketCapData.BTC;
        allProcessedData['ETH_MarketCap'] = marketCapData.ETH;

        const btcEthCorrelation = await calculateCorrelations();
        allProcessedData['BTC_ETH_Correlation'] = btcEthCorrelation;

        // Prepare data for Google Sheets
        const headers = Object.keys(allProcessedData);
        const values = Object.values(allProcessedData);

        const sheetData = [headers].concat([values]);

        const sheetTitle = 'CombinedMarketData';
        await appendAllDataFromJson_big(auth, spreadsheetId, sheetTitle, sheetData);

        console.log('Data from all markets along with BTC and ETH market cap exported successfully to Google Sheets.');

        return allProcessedData;
    } catch (error) {
        console.error('Error in exportAllMarketDataWithMarketCap:', error);
    }
}

// Example usage
async function calculatePositions() {

    const data = await exportAllMarketDataWithMarketCap()
    
    console.log("Exported Data:", data);
    console.log("BTCUSDT_1Dposition:", data['BTCUSDT_1Dposition']);

    const time = data['BTCUSDT_unix'];
    const btc1= data['BTCUSDT_1Dposition'];
    const btc2= data['BTCUSDT_2Dposition'];

    const btc3= data['BTCUSDT_3Dposition'];

    const btc4= data['BTCUSDT_4Dposition'];

    const btc5= data['BTCUSDT_5Dposition'];

    const btc6= data['BTCUSDT_6Dposition'];

    const btcW= data['BTCUSDT_Wposition'];

    const btcM= data['BTCUSDT_Mposition'];

    const eth1= data['ETHUSDT_1Dposition'];
    const eth2= data['ETHUSDT_2Dposition'];

    const eth3= data['ETHUSDT_3Dposition'];

    const eth4= data['ETHUSDT_4Dposition'];

    const eth5= data['ETHUSDT_5Dposition'];

    const eth6= data['ETHUSDT_6Dposition'];

    const ethW= data['ETHUSDT_Wposition'];

    const ethM= data['ETHUSDT_Mposition'];


    const ethbtc1= data['ETHBTC_1Dposition'];
    const ethbtc2= data['ETHBTC_2Dposition'];

    const ethbtc3= data['ETHBTC_3Dposition'];

    const ethbtc4= data['ETHBTC_4Dposition'];

    const ethbtc5= data['ETHBTC_5Dposition'];

    const ethbtc6= data['ETHBTC_6Dposition'];

    const ethbtcW= data['ETHBTC_Wposition'];

    const ethbtcM= data['ETHBTC_Mposition'];

    const btcPrice= data['BTCUSDT_closeprice'];

    const ethPrice= data['ETHUSDT_closeprice'];

    const btcMatketCap= data['BTC_MarketCap'];

    const ethMarketCap= data['ETH_MarketCap'];

    const MarketCap = btcMatketCap + ethMarketCap;


    let btcWSum = btc1 * 6 + btc2 * 3 + btc3 * 0 + btc4 * 3 + btc5 * 0 + btc6 * 2 + btcW * 0 + btcM * 2 
    let ethWSum = eth1 * 6 + eth2 * 3 + eth3 * 0 + eth4 * 3 + eth5 * 0 + eth6 * 2 + ethW * 0 + ethM * 2 
    let ethbtcWSum = ethbtc1 * 6 + ethbtc2 * 3 + ethbtc3 * 0 + ethbtc4 * 3 + ethbtc5 * 0 + ethbtc6 * 2 + ethbtcW * 0 + ethbtcM * 2 

    const TPI = (btcWSum * btcMatketCap + ethWSum* ethMarketCap) / MarketCap
   btcWSum = btcWSum /16
   ethWSum = ethWSum /16

   ethbtcWSum = ethbtcWSum /16


 
const fib_value = 0.786;
let btc_position = 0.5;

if (ethbtcWSum > 0.19 && TPI > 0) {
    btc_position = 1 - fib_value;
} else if (ethbtcWSum > 0.19 && TPI < 0) {
    btc_position = fib_value;
} else if (ethbtcWSum < 0.09 && TPI > 0) {
    btc_position = fib_value;
} else if (ethbtcWSum < 0.09 && TPI < 0) {
    btc_position = 1 - fib_value;
} else {
    btc_position = 0.5;
}
let eth_position = 1 - btc_position

btc_position = btc_position * (TPI / abs(TPI))
eth_position = eth_position * (TPI / abs(TPI))


console.log("BTC Position: ", btc_position);
console.log("ETH Position: ", eth_position);
console.log("ETHBTC Sum: ", ethbtcWSum);
console.log("BTC Sum: ", btcWSum);
console.log("ETH Sum: ", ethWSum);

const data2 = { 'btc_position' : btc_position , 'eth_position' : eth_position}

return data2



}

// async function scheduledTask() {
//     try {


//         console.log('Task started at x UTC');
//         const data = await exportAllMarketDataWithMarketCap();
//         console.log("Scheduled Task Completed. Data:", data);
//         // Additional logic if needed

//         console.log('Task end at x UTC');

//     } catch (error) {
//         console.error('Error in scheduled task:', error);
//     }
// }

// cron.schedule('* * * * *', scheduledTask, {
//     scheduled: true,
//     timezone: "UTC"
// });
// console.log('Task taken in a count at x UTC');

const express = require('express');
const app = express();
const { readFile } = require('fs').promises;

app.use(express.static('public'));


const path = require('path');

app.get('/', async (request, response) => {
    response.send(await readFile(path.join(__dirname, 'public', 'home.html'), 'utf8'));
});



app.get('/runTask', async (req, res) => {
    try {
        console.log('HTTP request received at /runTask');
        const data = await calculatePositions();
        console.log("HTTP Task Completed. Data:", data);

        // Send response back to client
        res.json(data);
    } catch (error) {
        console.error('Error in HTTP task:', error);
        res.status(500).send('Internal Server Error');
    }
});


app.use(express.static('public'));

app.listen(process.env.PORT || 3000, () => console.log(`App available on http://localhost:3000`))

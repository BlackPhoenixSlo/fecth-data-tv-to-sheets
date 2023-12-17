# how to use js to run your bot


## How to Use Google Sheets API with Node.js

This guide provides step-by-step instructions on how to set up and use the Google Sheets API with Node.js for managing data related to TradingView (TV). Whether you're fetching data for technical analysis or tracking your trading strategies, this README will help you get started.

## Setup


great recouce to learn node js to G sheets
https://hackernoon.com/how-to-use-google-sheets-api-with-nodejs-cz3v316f

### Google Sheets Setup
1. **Set Up Google Sheets**:
   - Visit [Google Cloud Manager](https://console.cloud.google.com/).
   - Create a new project and set up Google Sheets API for the project.
   - Download the JSON file containing your credentials.

2. **Environment Setup**:
   - Fill in the `.env` file with the necessary credentials and paths obtained from your Google Cloud project.

### Application Setup
1. **Utility Functions**:
   - Copy all functions from `/utilfunctions` to the root directory of your application.

2. **User Authentication**:
   - Utilize `UserLogin.js` to authenticate and get TradingView credentials.
   - Note: If you don't have a premium TradingView account, you can only download data for 1D, W, and M timeframes.

3. **Data Fetching**:
   - Configure `fetchTVdata-toGsheet-OldM.js` with the appropriate information to parse the desired indicator and timeframe.

## Usage

### Fetching Data For Basktexting
- Run the following command to start data fetching:
  ```bash
  node fetchTVdata-toGsheet-OldM.js



## Daily Data Update

Execute this command each day to update your data in Google Sheets correctly:


Copy code
node run-server-fetch-daily-data-Tsheets.js


## Examples and Custom Scripts

Check the /examples directory to understand how to write your custom scripts.


## Additional Resources
For a detailed tutorial, email me or dm on discord.

algoalert.net
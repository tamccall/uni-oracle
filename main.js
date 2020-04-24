const CoinGecko = require('coingecko-api');
const {pollPrice} = require('./poll');
const  Web3 = require('web3');
const EWMA = require('./ewma');
const express = require('express');
const { createTerminus } = require('@godaddy/terminus');
const http = require('http');

const app = express();
const ONE_MINUTE = 60 * 1000;
const halfLife = Math.pow(1/2, 1 / (ONE_MINUTE));
const ewma = new EWMA(halfLife, 0);

app.get('/price', (req, res) => {
  res.send({
    price: ewma.value().toFixed(18)
  });
});

const server = http.createServer(app);

const provider = new Web3.providers.WebsocketProvider(process.env['MAINNET_URL']);
const web3 = new Web3(provider);
const coinGeckoClient = new CoinGecko();

(async () => {
  const subscription = await pollPrice(web3, coinGeckoClient, ewma);
  createTerminus(server, {
    onShutdown: () => {
      console.log('unsubscribing');
      subscription.unsubscribe(function(error, success){
        if(success) {
          console.log('Successfully unsubscribed!');
        } else if (error) {
          console.log('Error unsubscribing', error)
        }
      });
    }
  });
  console.log('starting server');
  server.listen(8080);
})();
const {pollPrice} = require('./poll');
const express = require('express');
const { createTerminus } = require('@godaddy/terminus');
const http = require('http');
const ssbClient = require('ssb-client');
const  Web3 = require('web3');

(async () => {

  const client = await ssbClient();
  const web3 = new Web3();
  const {ewma} = await pollPrice((uniValue) => {
    console.info('have price publishing to skuttlebutt');
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const priceAsWei = web3.utils.toWei(uniValue.toFixed(18), 'ether');
    const priceHex = web3.utils.toHex(priceAsWei);
    const assetPair = 'UNIV1USD';
    const timeHex = web3.utils.numberToHex(timestamp);
    const assetPairHex = web3.utils.toHex(assetPair);
    client.publish({
      timeHex,
      priceHex,
      assetPairHex,
      type: assetPair,
      time: timestamp,
      price: uniValue.toNumber(),
      hash: web3.utils.sha3(`0x${priceHex}${timeHex}${assetPairHex}`)
    }, (err, msg) => {
      if (err) {
        console.error('error publishing to skuttlebutt', err)
      }

      console.info('successully published message to scuttlebutt', msg)
    })
  });

  const app = express();
  app.get('/price', (req, res) => {
    res.send({
      price: ewma.value().toFixed(18)
    });
  });
  const server = http.createServer(app);
  createTerminus(server, {
  });
  console.log('starting server');
  server.listen(8080);
})();
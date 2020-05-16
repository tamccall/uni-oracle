const {pollPrice} = require('./poll');
const express = require('express');
const { createTerminus } = require('@godaddy/terminus');
const http = require('http');
const ssbClient = require('ssb-client');
const  Web3 = require('web3');
const fs = require('fs');

(async () => {

  const client = await ssbClient();
  const web3 = new Web3();
  const keystore = fs.readFileSync(process.env['ETH_KEYSTORE']).toString();
  const account = web3.eth.accounts.decrypt(keystore, process.env['ETH_PASSWORD']);
  const {ewma, subscription} = await pollPrice((uniValue) => {
    console.info('have price publishing to skuttlebutt');
    const timestamp = Math.floor(new Date().getTime() / 1000);
    const priceAsWei = web3.utils.toWei(uniValue.toFixed(18), 'ether');
    const priceHex = web3.utils.toHex(priceAsWei);
    const assetPair = 'UNIV1USD';
    const timeHex = web3.utils.numberToHex(timestamp);
    const assetPairHex = web3.utils.toHex(assetPair);
    const hash = web3.utils.sha3(`0x${priceHex}${timeHex}${assetPairHex}`);
    const signature = account.sign(hash).signature;
    client.publish({
      timeHex,
      priceHex,
      assetPairHex,
      hash,
      signature,
      type: assetPair,
      time: timestamp,
      price: uniValue.toNumber(),
    }, (err, msg) => {
      if (err) {
        console.error('error publishing to skuttlebutt', err)
      } else {
        console.info('successfully published message to scuttlebutt', msg)
      }
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
    signal: 'SIGINT',
    beforeShutdown: () => {
      console.info('shutting down');
      subscription.unsubscribe((err) => {
        if (err) {
          console.error('error un-subscribing', err)
        }
      })
    }
  });
  console.log('starting server');
  server.listen(8080);
})();
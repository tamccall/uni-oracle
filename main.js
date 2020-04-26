const {pollPrice} = require('./poll');
const express = require('express');
const { createTerminus } = require('@godaddy/terminus');
const http = require('http');
const ssbClient = require('ssb-client');

(async () => {

  const client = await ssbClient();

  const {ewma} = await pollPrice((uniValue) => {
    console.info('have price publishing to skuttlebutt');
    client.publish({
      type: 'UNIV1USD',
      price: uniValue.toNumber()
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
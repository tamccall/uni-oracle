const {pollPrice} = require('./poll');
const express = require('express');
const { createTerminus } = require('@godaddy/terminus');
const http = require('http');

(async () => {
  const {ewma} = await pollPrice((uniValue) => {
    console.log(`Value is: ${uniValue.toFixed(18)}`)
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
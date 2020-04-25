const {pollPrice} = require('./poll');
const express = require('express');
const { createTerminus } = require('@godaddy/terminus');
const http = require('http');

(async () => {
  const {subscription, ewma} = await pollPrice();
  const app = express();
  app.get('/price', (req, res) => {
    res.send({
      price: ewma.value().toFixed(18)
    });
  });
  const server = http.createServer(app);
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
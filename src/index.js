'use strict';

import bodyParser from 'body-parser'
import fetch from 'node-fetch'
import 'url-search-params-polyfill'
import 'babel-polyfill'

import express from 'express'
const app = express();
app.use(bodyParser.json({limit: '25mb'}));
app.use(bodyParser.urlencoded({limit: '25mb', extended: true}));
app.use(bodyParser.json());

app.get('/', async (req, res) => {
  try {
    res.send({stuff: 'things'});
  } catch (error) {
    console.log('ERROR', error);
    res.status(400).send(error);
  }
});

app.listen(process.env.PORT || 3002, () => {
  console.log(`Find the server at: http://localhost:${process.env.PORT || 3002}/`); // eslint-disable-line no-console
});
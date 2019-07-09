'use strict';
require('dotenv').config();
const env = process.env;

import bodyParser from 'body-parser'
import fetch from 'node-fetch'
import 'url-search-params-polyfill'
import 'babel-polyfill'

import express from 'express'
const app = express();
app.use(bodyParser.json({limit: '25mb'}));
app.use(bodyParser.urlencoded({limit: '25mb', extended: true}));
app.use(bodyParser.json());

import twilio from 'twilio';
const twilioClient = twilio(env['TWILIO_ACCOUNT_SID'], env['TWILIO_AUTH_TOKEN']);

app.get('/', async (req, res) => {
  try {
    let message = await twilioClient.messages.create({
      body: "Here it is!",
      from: env['TWILIO_FROM_PHONE_NUMBER'],
      to: '+18053051394'
    });

    res.send(message);
  } catch (error) {
    console.log('ERROR', error);
    res.status(400).send(error);
  }
});

app.listen(process.env.PORT || 5000, () => {
  console.log(`Find the server at: http://localhost:${process.env.PORT || 5000}/`); // eslint-disable-line no-console
});
'use strict';
require('dotenv').config();
const env = process.env;

import bodyParser from 'body-parser'
import fetch from 'node-fetch'
import FormData from 'form-data'
import 'url-search-params-polyfill'
import 'babel-polyfill'

import express from 'express'
const app = express();
app.use(bodyParser.json({limit: '25mb'}));
app.use(bodyParser.urlencoded({limit: '25mb', extended: true}));
app.use(bodyParser.json());

import twilio from 'twilio';
const twilioClient = twilio(env['TWILIO_ACCOUNT_SID'], env['TWILIO_AUTH_TOKEN']);

// webhook to recieve message
app.post('/incoming-sms', async (req, res) => {
  try {
    let { body } = req;
    // get user info here
    // either start new issue or 

    let response = await fetch(`https://api.helpshift.com/v1/${env['HELPSHIFT_DOMAIN']}/issues`, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(env['HELPSHIFT_API_KEY']).toString('base64')}`
      },
      method: "POST",
      body: getFormData({
        'platform-id': env['HELPSHIFT_PLATFORM_ID'],
        'identifier': body['From'],
        'message-body': body['Body']
      })
    });
    let json = await response.json();


    res.send(json);
  } catch (error) {
    console.log('ERROR', error);
    res.status(400).send(error); 
  }
});

function getFormData(object) {
  let formData = new FormData();
  for ( var key in object ) formData.append(key, object[key]);
  return formData;
}

app.listen(process.env.PORT || 5000, () => {
  console.log(`Find the server at: http://localhost:${process.env.PORT || 5000}/`); // eslint-disable-line no-console
});
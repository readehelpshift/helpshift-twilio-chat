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

const CHECK_INTERVAL = 2500;
let intervals = {};

// webhook to recieve message
app.post('/incoming-sms', async ({ body }, res) => {
  try {
    let issue;

    let { issues } = await getExistingIssue(body['From'])
    if (issues && issues.length > 0) {
      // send to existing issue
      await sendMessageToAgent(issues[0]['id'], body)
    } else {
      issue = await createIssue(body);
      // listen to messages from issue
      setupMessageListener(issue);
    }

    res.send();
  } catch (error) {
    console.log('ERROR', error);
    res.status(400).send(error); 
  }
});

async function getExistingIssue(userId) {
  let params = new URLSearchParams({ 
    identifier: userId,
    "platform-id": env['HELPSHIFT_PLATFORM_ID'],
    state: ['new', 'new-for-agent', 'agent-replied', 'waiting-for-agent', 'pending-reassignment']
  });
  let response = await fetch(`https://api.helpshift.com/v1/${env['HELPSHIFT_DOMAIN']}/chat/my-issues?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(env['HELPSHIFT_API_KEY']).toString('base64')}`
    }
  });
  return await response.json();
}

async function createIssue({ From, Body }) {
  
  /********
  *********

  get user info here to add userId and CIFs

  *********
  ********/

  let response = await fetch(`https://api.helpshift.com/v1/${env['HELPSHIFT_DOMAIN']}/chat/issues`, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(env['HELPSHIFT_API_KEY']).toString('base64')}`
    },
    method: "POST",
    // TODO: attachments?
    body: getFormData({
      'platform-id': env['HELPSHIFT_PLATFORM_ID'],
      'identifier': From,
      'end_user_id': From,
      'message-body': Body
    })
  });
  return await response.json();
}

// TODO: attachments
async function sendMessageToAgent(issueId, { From, Body }) {
  let response = await fetch(`https://api.helpshift.com/v1/${env['HELPSHIFT_DOMAIN']}/chat/issues/${issueId}/messages/user`, {
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${Buffer.from(env['HELPSHIFT_API_KEY']).toString('base64')}`
    },
    method: "POST",
    body: getFormData({
      'identifier': From,
      'message-body': Body,
      'message-type': "Text"
    })
  });
  return await response.json();
}

function getFormData(object) {
  let formData = new FormData();
  for ( var key in object ) formData.append(key, object[key]);
  return formData;
}

async function setupMessageListener({ id, end_user_id }){
  intervals[id] = setInterval(async () => {

    let params = new URLSearchParams({ 
      "identifier": end_user_id,
      "messages-cursor": new Date().getTime() - CHECK_INTERVAL
    });
    let response = await fetch(`https://api.helpshift.com/v1/${env['HELPSHIFT_DOMAIN']}/chat/issues/${id}/messages?${params.toString()}`, {
      headers: {
        Accept: "application/json",
        Authorization: `Basic ${Buffer.from(env['HELPSHIFT_API_KEY']).toString('base64')}`
      }
    });

    let json = await response.json();
    let { messages, issue_state_data } = json;
    if (messages && issue_state_data) {
      let resolved = issue_state_data['state'] === 'resolved';
      let newMessages = messages.filter(message => message.origin === 'helpshift');

      if (resolved) {
        clearInterval(intervals[id]);
        newMessages.push({ body: "This issue has been resolved" })
      }

      await sendNewMessagesToUser(end_user_id, newMessages);
    } else {
      // This only happens when we have hit the API Rate limit
      // TODO: Retry
      console.log('Rate limit hit', json);
    }

  }, CHECK_INTERVAL)
}

// TODO: attachements
async function sendNewMessagesToUser(toPhoneNum, messages) {
  for (let message of messages) {
    try {
      await twilioClient.messages.create({
        to: toPhoneNum,
        from: env['TWILIO_FROM_PHONE_NUMBER'],
        body: message['body']
      });
    } catch (e) {
      console.log("Error sending SMS", e)
    }
  }
}

app.listen(process.env.PORT || 5000, () => {
  console.log(`Find the server at: http://localhost:${process.env.PORT || 5000}/`); // eslint-disable-line no-console
});
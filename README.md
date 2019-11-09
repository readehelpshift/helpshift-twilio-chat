# Getting Started

You will need:
 - Twilio Account with Programmable SMS
 - Helpshift Account

# Running the Code

 1. From the root directory run `npm install`  
 2. Change the name of `.env.example` –> `.env` and add your Helpshift/Twilio config.

```
TWILIO_ACCOUNT_SID=XXXXXXXXXXXX
TWILIO_AUTH_TOKEN=XXXXXXXXXXXX
TWILIO_FROM_PHONE_NUMBER=+1XXXXXXXXX

HELPSHIFT_API_KEY=presales_api_20190124214947582-72ae10a3f746c59
HELPSHIFT_DOMAIN=presales
HELPSHIFT_PLATFORM_ID=presales_platform_20190129232113757-ae9098b6089cd1b
```

 3. Install [ngrok](https://ngrok.com/download)
 4. Run `ngrok http 5000`
 5. Paste the ngrok url `https://XXXX.ngrok.io` as the webhook for outbound texts in Twilio as detailed [here](https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply-python#configure-your-webhook-url)
 6. Text your Twilio number

	 

 

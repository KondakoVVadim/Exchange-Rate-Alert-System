const express = require('express');
const nodemailer = require('nodemailer');
const cron = require('node-cron');
const axios = require('axios');
const mongoose = require('mongoose');
const migrateMongoose = require('migrate-mongoose');
const ElasticEmail = require('@elasticemail/elasticemail-client');

// Elastic Email configuration
const defaultClient = ElasticEmail.ApiClient.instance;
let apikey = defaultClient.authentications['apikey'];
apikey.apiKey = '2382F3AB04DCBCA6DB971490D6683F4F4ACDFA77AE37A0AAAC61B096A7D5B7D3575A1167797CC4472589F43FEF4BB76C';

// Elastic Email API initialization
const api = new ElasticEmail.EmailsApi();

// Express app initialization
const app = express();
const port = 3000;

// MongoDB connection using Mongoose
const DB_HOST = "mongodb+srv://Vadym:chirik228@cluster0.4yinucb.mongodb.net/emails?retryWrites=true&w=majority&appName=Cluster0";
mongoose.connect(DB_HOST).then(() => console.log('Connected to MongoDB'));

// Email schema and model definition
const emailSchema = new mongoose.Schema({
    email: String
});
const Email = mongoose.model('Email', emailSchema);

// Exchange rate schema and model definition
const exchangeRateSchema = new mongoose.Schema({
    rate: Number,
    timestamp: {type: Date, default: Date.now}
});
const ExchangeRate = mongoose.model('ExchangeRate', exchangeRateSchema);

app.use(express.json());

// Function to fetch current exchange rate from API
const apiKey = 'd912ba48ebb05fff4000b857';
const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;

async function fetchExchangeRate() {
    try {
        const response = await axios.get(apiUrl);
        const usdToUah = response.data.conversion_rates.UAH;
        await ExchangeRate.findOneAndUpdate(
            {},
            {rate: usdToUah, timestamp: Date.now()},
            {upsert: true, new: true}
        );
        return usdToUah;
    } catch (error) {
        console.error('An error occurred while retrieving exchange rate data:', error.message);
        return null;
    }
}

// Cron job scheduling
cron.schedule('* * * * *', async () => {
    main();
    console.log('The letter was sent successfully!');
});

// Callback function for API calls
const callback = function (error, data, response) {
    if (error) {
        console.error(error.message);
    } else {
        console.log('API called successfully');
    }
};

// Function to get email list
async function getEmailList() {
    try {
        const emailList = await Email.find().distinct('email');
        return emailList;
    } catch (error) {
        console.error('An error occurred while fetching email list:', error.message);
    }
}

async function main() {
    const exchangeRate = await fetchExchangeRate();
    if (exchangeRate !== null) {
        await ExchangeRate.findOneAndUpdate(
            {},
            {rate: exchangeRate, timestamp: Date.now()},
            {upsert: true, new: true}
        );
        let emailList = await getEmailList();
        const emailRecipients = emailList.map(email => new ElasticEmail.EmailRecipient(email));
        const emailContent = `Current exchange rate of 1 US dollar (USD) to hryvnia (UAH): ${exchangeRate}`;
        const emailMessageData = ElasticEmail.EmailMessageData.constructFromObject({
            Recipients: emailRecipients,
            Content: {
                Body: [
                    ElasticEmail.BodyPart.constructFromObject({
                        ContentType: 'HTML',
                        Content: emailContent
                    })
                ],
                Subject: "JS EE lib test",
                From: 'agentvl@ukr.net'
            }
        });
        api.emailsPost(emailMessageData, callback);
    }
}


app.get('/api/rate', async (req, res) => {
    try {
        const exchangeRate = await fetchExchangeRate();
        if (exchangeRate !== null) {
            res.json({usdToUah: exchangeRate});
        } else {
            res.status(500).json({error: 'Failed to fetch exchange rate'});
        }
    } catch (error) {
        console.error('An error occurred while retrieving the exchange rate:', error.message);
        res.status(500).json({error: 'Failed to fetch exchange rate'});
    }
});

app.post('/api/subscribe', async (req, res) => {
    const email = req.body.email;
    if (typeof email === 'string' && email.trim() !== '') {
        try {
            const existingEmail = await Email.findOne({email});
            if (existingEmail) {
                res.status(409).json({error: 'Email already exists in the database'});
            } else {
                await Email.create({email});
                res.status(200).json({message: 'Email subscribed successfully'});
            }
        } catch (error) {
            console.error('Error subscribing email:', error.message);
            res.status(500).json({error: 'Failed to subscribe email'});
        }
    } else {
        res.status(400).json({error: 'Invalid email format'});
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

# Currency Exchange Rate Notifier

This Node.js application serves as a currency exchange rate notifier, sending email notifications at 9am every day with the current USD to Hryvnia exchange rate and allowing users to subscribe to updates.

## Description of functions

- **fetchExchangeRate()**: This function asynchronously retrieves the current USD to UAH exchange rate from an external API. It then updates or creates a record in the MongoDB database with the resulting exchange rate.
- **main()**: The main scheduled function uses fetchExchangeRate() to get the current exchange rate. If the rate is successfully received, it also updates the database and sends emails with the current exchange rate to registered users.
- **getEmailList()**: This function asynchronously retrieves a list of registered email addresses from the MongoDB database.
- callback(error, data, response A callback function used to process responses from the Elastic Email API. If an error occurs, it prints an error message to the console. Otherwise, it displays a message indicating a successful API call.
- **const cron**: calls the main function every day at 9 am.

## Dependencies

- **Express**: Web framework for Node.js.
- **Nodemailer**: Module for sending emails.
- **Node-cron**: Cron-like scheduler for Node.js.
- **Axios**: HTTP client for making requests.
- **Mongoose**: MongoDB object modeling for Node.js.
- **ElasticEmail**: Client for Elastic Email API.

## Installation

1. Clone the repository: `git clone <repository-url>`
2. Install dependencies: `npm install`
3. Configure Elastic Email API key in `index.js`.
4. Configure MongoDB connection URI in `index.js`.
5. Start the server: `node server.js`

## Usage

### Fetch Current Exchange Rate

- Endpoint: `GET /api/rate`
- Response: `{ "usdToUah": exchangeRate }`

### Subscribe for Updates

- Endpoint: `POST /api/subscribe`
- Request Body: `{ "email": "example@example.com" }`
- Response: `200 OK` if subscription successful, `400 Bad Request` if invalid email format, `409 Conflict` if email already exists.

## Cron Job

The application schedules a cron job to fetch the exchange rate periodically and send email notifications.

## MongoDB

The application uses MongoDB to store subscribed emails and exchange rate data.

## Elastic Email

Elastic Email is used as the email service provider for sending notifications.

# Bugsnag Notification App

Bugsnag Notification App for RingCentral app.

## Run in Local

### 1. Clone this project

```
$ git clone this_project_uri
```

### 2. Install dependencies

Inside project root:

```
$ npm install
```

### 3. Start Ngrok to create a URI for public internet access

```
$ npm run ngrok
```

Keep this process active, and you will get a publish uri as `https://xxxxxxxxxx.ngrok.io` that connected with your local port `localhost:6066`.

### 4. Create `.env` file

```
$ cp .env.default .env
```

Edit `.env` file as `.env.default` to set environment variables.
The `APP_SERVER` is publish uri that we get from ngrok.
For `DATABASE_CONNECTION_URI`, we can just keep `sqlite://./db.sqlite`. We will use sqlite as local database.

### 5. Setup Database

We will use sqlite as local database. Please install sqlite3 in your machine firstly.

Init Database:

```
$ npm run initDB
```

### 6. Start server

```
$ npm start 
```

Visit your publish uri `https://xxxxxx.ngrok.io/webhook/new?webhook=glipWebhookUri`, and follow step to connect Glip conversation and Bugsnag project.

For test, you can get `glipWebhookUri` from Glip Incoming Webhook integration.

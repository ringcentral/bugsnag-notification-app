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

## Deploy with serverless

### 1. Create `serverless-deploy/env.yml` file

```
$ cp serverless-deploy/env.default.yml serverless-deploy/env.yml
```

Edit `serverless-deploy/env.yml` to set environment variables.
We will get `APP_SERVER` after first deploy. So now just keep it blank.

### 2. Create `serverless-deploy/serverless.yml` file

```
$ cp serverless-deploy/serverless.default.yml serverless-deploy/serverless.yml
```

Edit `serverless-deploy/env.yml` to update serverless settings.
The Dynamo `TableName` should be `${DYNAMODB_TABLE_PREFIX}webhooks`. DYNAMODB_TABLE_PREFIX is environment variable that we set upper.

### 3. Deploy

```
$ npm run serverless-build
$ npm run serverless-deploy
```

In first deploy, you will get lambda uri in console output: `https://xxxxxx.execute-api.us-east-1.amazonaws.com/prod`.
Copy the uri, and update environment variable `APP_SERVER` with it in `serverless-deploy/env.yml` file. Then deploy again:

```
$ npm run serverless-deploy
```

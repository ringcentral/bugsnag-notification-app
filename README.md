# Bugsnag Notification Add-in

[![Build Status](https://github.com/ringcentral/bugsnag-notification-app/workflows/CI%20Pipeline/badge.svg?branch=main)](https://github.com/ringcentral/bugsnag-notification-app/actions)

[Bugsnag notification add-in](https://www.ringcentral.com/apps/bugsnag) for [RingCentral app](app.ringcentral.com).

## Development

### 1. Clone this project

```
$ git clone https://github.com/ringcentral/bugsnag-notification-app.git
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

Visit your publish uri `https://xxxxxx.ngrok.io/webhook/new?webhook=rcWebhookUri`, and follow step to connect [RingCentral](https://app.ringcentral.com/) conversation and Bugsnag project.

For test, you can get `rcWebhookUri` from [RingCentral Incoming Webhook integration](https://www.ringcentral.com/apps/glip-webhooks).

### 7. Create a free RingCentral add-in app

Please follow [here](https://developers.ringcentral.com/guide/team-messaging/add-ins/creation) to create a RingCentral notification add-in app.

In `App Features`, enable `Interactive Messages`, then input URI `https://xxxxxx.ngrok.io/interactive-messages`. Please replace with your ngrok domain.

In `Integrated installation in RingCentral app` section, enable `This app can be installed via the web`, then input URI `https://xxxxxx.ngrok.io/webhook/new`. 

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

Then update app settings in [RingCentral developer portal](https://developers.ringcentral.com/), with your new `APP_SERVER`.

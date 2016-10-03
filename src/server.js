import express from 'express';
import http from 'http';
import https from 'https';
import bodyParser from 'body-parser';
import cors from 'cors';
import createLogger from './logger';
import config from './config';
import {init as dbInit} from './db';
import fs from 'fs';
import path from 'path';
import scanRouter from './routes/scan';
import propertiesRouter from './routes/properties';
import ccPaymentRouter from './routes/ccpayment';
// import reportsRouter from './routes/reports';



process.env.NODE_ENV = process.env.NODE_ENV || 'local';
const PORT = process.env.PORT || config.port || 8080;

const logger = createLogger(config.log);

let app = express();
const pool = dbInit(config);

// =============================================================================
// ==== ROUTES =================================================================
// =============================================================================
app.get('/', function(req, res, next) {
  res.send("pong");
});

// Middleware
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use(cors());



// Set up routes for the various services
app.use(scanRouter(config));
app.use(propertiesRouter(config));
app.use(ccPaymentRouter(config));
// app.use(reportsRouter(config));
// -----------------------------------------------------------------------------

// =============================================================================
// ==== ERROR HANDLING =========================================================
// =============================================================================
app.use(function(err, req, res, next) {
  const status = err.status || err.statusCode || 500;

  let retErr = { message: err.message, ErrorCode: err.ErrorCode };

  if (process.env.NODE_ENV !== 'production')
  retErr.stack = err.stack;

  if (process.env.NODE_ENV !== 'production') {
    console.log(err.stack);
  }

  res.status(status).json(retErr)
})
// -----------------------------------------------------------------------------


// =============================================================================
// ==== OFF WE GO ==============================================================
// =============================================================================
let server;
if (process.env.NODE_ENV === 'local' && false) {
  const httpsOptions = {
    key: fs.readFileSync(path.resolve(__dirname, '..', 'dev/key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, '..', 'dev/ssl.crt'))
  }
  console.log("HTTPS!");
  server = https.createServer(httpsOptions, app);
} else {
  server = http.createServer(app);
}


server.listen(PORT, () => {
  logger.info(`API listening on port ${PORT}`);
}).on('close', () => {
  pool.end(err => logger.error("CONNECTION POOL CLOSING ERROR", err));
});
// -----------------------------------------------------------------------------

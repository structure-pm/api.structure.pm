import restify from 'restify';
import scanRouter from './routes/scan';
import createLogger from './logger';
import config from './config';
import {init as dbInit} from './db';


const PORT = process.env.PORT || 8080;

const logger = createLogger(config);
let server = restify.createServer({
  name: "api.structure.pm",
  log: logger
});

const pool = dbInit(config);

// =============================================================================
// ==== ROUTES =================================================================
// =============================================================================
server.get('/', function(req, res, next) {
  res.send("pong");
});

// Middleware
server.use(restify.bodyParser());


// Set up routes for the various services
scanRouter(server, config);
// -----------------------------------------------------------------------------

server.listen(PORT, function() {
  logger.info('%s listening at %s', server.name, server.url);
}).on('error', function (e) {
	logger.error('SERVER ERROR', e);
}).on('close', function() {
  pool.end(err => logger.error("CONNECTION POOL CLOSING ERROR", err));
}).on('InternalServer', function (req, res, err, next) {
  logger.error("ERR!");
  if (process.env.NODE_ENV === 'development') {
    console.log(err.stack);
  }
  return next(err);
});

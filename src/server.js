import restify from 'restify';
import scanRouter from './routes/scan';
import createLogger from './logger';
import config from './config';


const PORT = process.env.PORT || 8080;

const logger = createLogger(config);
let server = restify.createServer({
  name: "api.structure.pm",
  log: logger
});


server.get('/', function(req, res, next) {
  res.send("pong");
});

// Set up routes for the various services
scanRouter(server, config);


server.listen(PORT, function() {
  logger.info('%s listening at %s', server.name, server.url);
}).on('error', function (e) {
	logger.error('SERVER ERROR', e);
});

import restify from 'restify';
import logger from './logger';
import scanRouter from './routes/scan';


const PORT = process.env.PORT || 8080;

function ping(req, res, next) {
  res.send("pong");
}

var server = restify.createServer({
  name: "api.structure.pm",
  log: logger
});


server.get('/', ping);

// Set up routes for the various services
scanRouter(server);


server.listen(PORT, function() {
  logger.info('%s listening at %s', server.name, server.url);
}).on('error', function (e) {
	logger.error('SERVER ERROR', e);
});

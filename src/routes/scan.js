import * as scan from './controllers/scan.controller';

export default function(server) {
  server.post('/scan', scan.importScan);
  server.get('/scan/unknown', scan.getUnknownAccounts);
}

import UnknownAccounts from '../../domain/scan/unknownAccounts.repository';

export function importScan(req, res, next) {
  res.send("scan received");
}


export function getUnknownAccounts(req,res,next) {
  UnknownAccounts.find()
    .then(accounts => {
      res.json(accounts);
    })
    .catch(next);
}

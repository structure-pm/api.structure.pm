import {expect} from 'chai';
import Promise from 'bluebird';
import createAccountAssetService from '../../src/domain/scan/accountAsset.service';

describe("accountAsset service", () => {
  describe("clearUnknownAccounts", () => {
    it("creates bills for all unknown accounts", done => {
      let billsCreated = 0,
          accountsDeleted = 0;
      const UnknownAccountsRepository = {
        find(_) { return Promise.resolve([{id: 1}, {id: 2}, {id: 3}]); },
        deleteMultiple(ids) { return Promise.resolve(accountsDeleted=ids.length); }
      }
      const importScanService = {
        createBillFromScan(scanData) { return Promise.resolve({id: billsCreated++}); },
      }

      let AccountAsset = createAccountAssetService();
      AccountAsset.services.importScan = importScanService;
      AccountAsset.repositories.UnknownAccounts = UnknownAccountsRepository;

      AccountAsset.clearUnknownAccounts({a: 'b'})
        .then(_ => {
          expect(billsCreated).to.equal(3);
          expect(accountsDeleted).to.equal(3);
          done();
        })
        .catch(done);
    });
  });
});

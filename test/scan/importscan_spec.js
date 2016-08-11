import {expect} from 'chai';
import ImportScan from '../../src/domain/scan/importScan.service';

describe("ImportScan service", () => {
  describe("repository", () => {
    it("sets an aribitrary repo", () => {
      ImportScan.repository('testRepo', 123);
      expect(ImportScan.repository('testRepo')).to.equal(123);
    });
  });


  describe("importScan", () => {
    it("creates an unknownAccount object when an account's asset is not found", done => {
      let fired = false;
      const AccountAssetRepo = {
        getAssetByAccountNumber(an) { fired = true; return Promise.resolve(null); }
      };
      const UnknownAccountsRepo = {
        create(data) { return Promise.resolve({id: 123})},
      };
      ImportScan.repository('AccountAsset', AccountAssetRepo);
      ImportScan.repository('UnknownAccounts', UnknownAccountsRepo);
      ImportScan.importScan({
        AccountNumber: "abc"
      })
      .then(results => {
        expect(fired).to.be.ok;
        expect(results.result).to.equal(ImportScan.RESULT_UNKNOWN_ACCOUNT);
        expect(results.data.unknownAccountId).to.equal(123);
        done();
      }).catch(done);
    });

  });
});

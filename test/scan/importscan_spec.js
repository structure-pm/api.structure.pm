import {expect} from 'chai';
import ImportScanService from '../../src/domain/scan/importScan.service';

describe("ImportScan service", () => {



  describe("importScan", () => {
    it("creates an unknownAccount object when an account's asset is not found", done => {
      let fired = false;
      // Mocked Repos
      const AccountAssetRepo = {
        getAssetByAccountNumber(an,vid) { fired = true; return Promise.resolve(null); }
      };
      const UnknownAccountsRepo = {
        create(data) { return Promise.resolve({id: 123})},
      };

      let ImportScan = ImportScanService();

      ImportScan.repositories.AccountAssets = AccountAssetRepo;
      ImportScan.repositories.UnknownAccounts = UnknownAccountsRepo;
      ImportScan.importScan({
        AccountNumber: "abc",
        CreditorNumber: 1,
        CurrentAmount: 123,
        TotalAmount: 123,
        DueDate: '2016-12-14'
      })
      .then(results => {
        expect(fired).to.be.ok;
        expect(results.result).to.equal(ImportScan.RESULT_UNKNOWN_ACCOUNT);
        expect(results.data.unknownAccountId).to.equal(123);
        done();
      }).catch(done);
    });

    it("Creates a bill from a scan", done=> {
      let fired = false;
      let billID = 3;
      const AccountAssetRepo = {
        getAssetByAccountNumber(an, vid) {return Promise.resolve({
          accountNumber: 'abc',
          vendorID: 1,
          expenseID: 1,
          assetType: 'location',
          assetID: 'testlocation',
        })}
      };
      const BillRepo = {
        create(billData) { fired = true; return Promise.resolve({id: billID})}
      }
      let ImportScan = ImportScanService();
      ImportScan.repositories.AccountAssets = AccountAssetRepo;
      ImportScan.repositories.Bills = BillRepo;
      ImportScan.importScan({
        AccountNumber: "abc",
        CreditorNumber: 1,
        CurrentAmount: 123,
        TotalAmount: 123,
        DueDate: '2016-12-14'
      })
        .then(results => {
          expect(fired).to.be.ok;
          expect(results.result).to.equal(ImportScan.RESULT_BILL_CREATED);
          expect(results.data.id).to.equal(billID);
          done();
        }).catch(done);
    });

  });
});

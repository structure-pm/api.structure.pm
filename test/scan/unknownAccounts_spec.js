import {expect} from 'chai';
import createUnknownAccounts from '../../src/domain/scan/unknownAccounts.repository';

describe("UnknownAccounts Repository", () => {
  let UnknownAccounts = createUnknownAccounts();
  
  describe("rawAccountToObject", () => {
    it("parses the json scanData", () => {
      const scanData = {abc: 123, def: 456};
      const scanDataText = JSON.stringify(scanData);
      const acct = {
        accountNumber: 'abc',
        vendorID: 1,
        scanData: scanDataText
      };
      let obj = UnknownAccounts.rawAccountToObject(acct);
      expect(obj.scanData).to.deep.equal(scanData);
    })
  });
});

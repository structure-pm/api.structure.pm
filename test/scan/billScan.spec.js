import {expect} from 'chai';
import BillScan from '../../src/domain/scan/billScan';

describe("Scan | BillScan", () => {
  
  it("Throws when missing a required field", () => {
    const rf = BillScan.requiredFields;
    const obj = rf.reduce((obj, fld) => Object.assign(obj, {[fld]: true}), {});

    rf.forEach(fld => {
      function willThrow() { return new BillScan(Object.assign(obj, {[fld]: undefined})); }
      expect(willThrow).to.throw(Error);
    });
  });

});

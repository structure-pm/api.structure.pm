import {expect} from 'chai';
import {Address} from '../../../src/domain/ccpayment/streamPay';

describe("StreamPay | Address", () => {
  it("creates a new address", () => {
    const addy = {
      AddressLine1: '102 Colonial Oaks Court',
      City: 'Louisville',
      RegionName: 'KY',
      PostalCode: '40214',
    }
    const address = new Address(addy);
    expect(address).to.be.an.instanceof(Address);
  });
  it("throws when there is data missing", () => {
    const addy1 = {
      City: 'Louisville',
      RegionName: 'KY',
      PostalCode: '40214',
    }
    const addy2 = {
      AddressLine1: '102 Colonial Oaks Court',
      RegionName: 'KY',
      PostalCode: '40214',
    }
    const addy3 = {
      AddressLine1: '102 Colonial Oaks Court',
      City: 'Louisville',
      PostalCode: '40214',
    }
    const addy4 = {
      AddressLine1: '102 Colonial Oaks Court',
      City: 'Louisville',
      RegionName: 'KY',
    }
    function willThrow1() { const a = new Address(addy1); }
    function willThrow2() { const a = new Address(addy2); }
    function willThrow3() { const a = new Address(addy3); }
    function willThrow4() { const a = new Address(addy4); }
    expect(willThrow1).to.throw(Error);
    expect(willThrow2).to.throw(Error);
    expect(willThrow3).to.throw(Error);
    expect(willThrow4).to.throw(Error);
  })
})

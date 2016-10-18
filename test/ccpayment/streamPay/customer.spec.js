import {expect} from 'chai';
import {Customer, Address} from '../../../src/domain/ccpayment/streamPay';

describe("StreamPay | Customer", () => {
  it("creates a new customer from json", () => {
    const cust = {
      FirstName: 'Aaron',
      LastName: 'Johnson',
      Email: 'email@address.com',
      Phone: '555-1234',
      Address: {
        AddressLine1: '102 Colonial Oaks Court',
        City: 'Louisville',
        RegionName: 'KY',
        PostalCode: '40214',
      }
    }
    const customer = new Customer(cust);
    expect(customer).to.be.an.instanceof(Customer);
    expect(customer.Address).to.be.an.instanceof(Address);
  })
  it("creates a new customer with Address", () => {
    const addy = {
      AddressLine1: '102 Colonial Oaks Court',
      City: 'Louisville',
      RegionName: 'KY',
      PostalCode: '40214',
    };
    const address = new Address(addy);
    const cust = {
      FirstName: 'Aaron',
      LastName: 'Johnson',
      Email: 'email@address.com',
      Phone: '555-1234',
      Address: address
    }
    const customer = new Customer(cust);
    expect(customer).to.be.an.instanceof(Customer);
    expect(customer.Address).to.be.an.instanceof(Address);
  })
})

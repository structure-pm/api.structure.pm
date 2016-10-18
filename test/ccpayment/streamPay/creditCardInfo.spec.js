import {expect} from 'chai';
import {CreditCardInfo} from '../../../src/domain/ccpayment/streamPay';

describe("StreamPay | CreditCardInfo", () => {
  it("creates a new CreditCardInfo from json", () => {
    const cci = {
      "CreditCardNumber": "4111111111111111",
      "Cvv2": "123",
      "ExpirationDate": "12/2020"
    }

    const ccInfo = new CreditCardInfo(cci);
    expect(ccInfo).to.be.an.instanceof(CreditCardInfo);
    expect(ccInfo.CreditCardType).to.equal("Visa");
  })
})

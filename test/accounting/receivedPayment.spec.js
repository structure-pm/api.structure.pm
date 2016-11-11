import {expect} from 'chai';
import ReceivedPayment from '../../src/domain/accounting/receivedPayment';
import PayRepo from '../../src/domain/accounting/receivedPayment.repository';
import Income from '../../src/domain/accounting/income';

describe.only("Accounting | ReceivedPayment", () => {
  describe("Creating", () => {
    it("creates a RP with empty lines", () => {
      const rp = new ReceivedPayment();
      expect(rp._lines).to.have.length(0);
      expect(rp._deletedLines).to.have.length(0);
    });
  })

  describe("addLine()", () => {
    it("adds an income line", () => {
      const rp = new ReceivedPayment();
      const line = new Income({amount: 123});
      rp.addLine(line);
      expect(rp._lines).to.have.length(1);
      expect(rp._lines[0].amount).to.equal(line.amount);
    })

    it("updates the amount and count", () => {
      const rp = new ReceivedPayment();
      expect(rp.amount).to.equal(0);
      expect(rp.items).to.equal(0);

      rp.addLine(new Income({amount: 111}));
      rp.addLine(new Income({amount: 222}));

      expect(rp.amount).to.equal(333);
      expect(rp.items).to.equal(2);
    })

    it("sets the dirty flag", () => {
      const rp = new ReceivedPayment();
      rp.addLine(new Income({amount: 123}));
      expect(rp._lines[0]._dirty).to.be.ok;
    })

    it("lines inherit leaseID etc from parent payment", () => {
      const rp1 = new ReceivedPayment({leaseID: 1});
      const rp2 = new ReceivedPayment({accountID: 2});
      const rp3 = new ReceivedPayment({tenantID: 3});
      const rp4 = new ReceivedPayment({locationID: '4'});
      const rp5 = new ReceivedPayment({invoiceID: 5});

      expect(rp1.leaseID).to.be.ok;
      expect(rp2.accountID).to.be.ok;
      expect(rp3.tenantID).to.be.ok;
      expect(rp4.locationID).to.be.ok;
      expect(rp5.invoiceID).to.be.ok;

      rp1.addLine({amount: 50});
      rp2.addLine({amount: 50});
      rp3.addLine({amount: 50});
      rp4.addLine({amount: 50});
      rp5.addLine({amount: 50});

      expect(rp1._lines[0].leaseID).to.equal(rp1.leaseID)
      expect(rp2._lines[0].accountID).to.equal(rp2.accountID)
      expect(rp3._lines[0].tenantID).to.equal(rp3.tenantID)
      expect(rp4._lines[0].locationID).to.equal(rp4.locationID)
      expect(rp5._lines[0].invoiceID).to.equal(rp5.invoiceID)
    })

    it("lines inherit the payment Date from parent payment", () => {
      const rp = new ReceivedPayment();
      rp.addLine({amount:1, dateStamp: '2008-11-4'});
      rp.addLine({amount:2});
      expect(rp.paymentDate).to.be.ok;
      expect(rp._lines[0].dateStamp).to.equal(rp.paymentDate);
      expect(rp._lines[1].dateStamp).to.equal(rp.paymentDate);
    })
  })

  describe("setLine()", () => {
    it("adds an array of lines", () => {
      const rp = new ReceivedPayment();
      const lines = [
        new Income({amount: 111}),
        new Income({amount: 222})
      ];
      expect(rp._lines).to.have.length(0);
      rp.setLines(lines);
      expect(rp._lines).to.have.length(2);
    })

    it("does not set the dirty flag", () => {
      const rp = new ReceivedPayment();
      const lines = [
        new Income({amount: 111}),
        new Income({amount: 222})
      ];
      rp.setLines(lines);
      expect(rp._lines[0]._dirty).to.not.be.ok;
      expect(rp._lines[1]._dirty).to.not.be.ok;
    })

    it("resets the lines and deleted lines", () => {
      const rp = new ReceivedPayment();
      rp._lines = [1,2];
      rp._deletedLines = [3,4];
      expect(rp._lines).to.have.length(2);
      expect(rp._deletedLines).to.have.length(2);
      rp.setLines([]);
      expect(rp._lines).to.have.length(0);
      expect(rp._deletedLines).to.have.length(0);
    })

    it("updates the amount and count", () => {
      const rp = new ReceivedPayment();
      const lines = [
        new Income({amount: 111}),
        new Income({amount: 222})
      ];
      rp.setLines(lines);
      expect(rp.amount).to.equal(333);
      expect(rp.items).to.equal(2);
    })
  })

  describe("updateLine()", () => {
    it("updates the line", () => {
      const rp = new ReceivedPayment();
      const lines = [
        {amount: 111},
        {amount: 222}
      ];
      rp.setLines(lines);
      rp.updateLine(0, {amount: 333});
      expect(rp._lines[0].amount).to.equal(333);

    })

    it("updates the amount and count", () => {
      const rp = new ReceivedPayment();
      const lines = [
        {amount: 111},
        {amount: 222}
      ];
      rp.setLines(lines);
      expect(rp.amount).to.equal(333);
      expect(rp.items).to.equal(2);
      rp.updateLine(0, {amount: 333});
      expect(rp.amount).to.equal(555);
      expect(rp.items).to.equal(2);
    })
  })

  describe("deleteLine()", () => {
    it("removes a line from the collection", () => {
      const rp = new ReceivedPayment();
      const lines = [
        {amount: 111},
        {amount: 222}
      ];
      rp.setLines(lines);
      expect(rp._lines).to.have.length(2);
      rp.removeLine(0);
      expect(rp._lines).to.have.length(1);
      expect(rp._lines[0].amount).to.equal(222);
    })

    it("adds the line to the deleted collection", () => {
      const rp = new ReceivedPayment();
      const lines = [
        {amount: 111},
        {amount: 222}
      ];
      rp.setLines(lines);
      expect(rp._lines).to.have.length(2);
      expect(rp._deletedLines).to.have.length(0);
      rp.removeLine(0);
      expect(rp._lines).to.have.length(1);
      expect(rp._deletedLines).to.have.length(1);
    })

    it("updates the amount and count", () => {
      const rp = new ReceivedPayment();
      const lines = [
        {amount: 111},
        {amount: 222}
      ];
      rp.setLines(lines);
      expect(rp.amount).to.equal(333);
      expect(rp.items).to.equal(2);
      rp.removeLine(0);
      expect(rp.amount).to.equal(222);
      expect(rp.items).to.equal(1);
    })
  });
});

describe("Accounting | ReceivedPayment Repo", () => {

});

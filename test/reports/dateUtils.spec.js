import {expect} from 'chai';
import Moment from 'moment';
import {monthsBetween} from '../../src/domain/reports/dataServices/dateUtils';

describe("Report | dateUtils", () => {
  describe("monthsBetween()", () => {
    it("gets months from JS Dates", () => {
      const startDate = Moment().startOf('year').toDate();
      const endDate = Moment().endOf('year').toDate();
      const months = monthsBetween(startDate, endDate);
      expect(months).to.have.length(12);
      for (let i=0; i<12; i++) {
        expect(months[i].toString()).to.equal(Moment().startOf('year').add(i, 'month').toDate().toString());
      }
    });
    it("gets months from ISO formatted strings", () => {
      const startDate = '2016-01-01';
      const endDate = '2016-12-31';
      const months = monthsBetween(startDate, endDate);
      expect(months).to.have.length(12);
      for (let i=0; i<12; i++) {
        expect(months[i].toString()).to.equal(Moment().startOf('year').add(i, 'month').toDate().toString());
      }
    });
  });
});

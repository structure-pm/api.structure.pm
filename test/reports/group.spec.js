import {expect} from 'chai';
import Column from '../../src/domain/reports/generalListTemplate/column';
import Group from '../../src/domain/reports/generalListTemplate/group';

describe('Group', () => {
  describe("Creating", () => {
    it("Calculates aggregates", () => {
      const items = [
        {total: 1},
        {total: 2},
        {total: 3},
      ]
      const columns = [
        new Column('myCol', 'total', 0),
      ]
      const group = new Group('test', items, columns, {
        aggregates: {sum: 'total'}
      });

      expect(group.aggregates).to.have.length(1);
      expect(group.aggregates[0]).to.have.property('sum');
      expect(group.aggregates[0].sum).to.equal(6);
    })
  });
});

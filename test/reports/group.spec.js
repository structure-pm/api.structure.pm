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

  describe("groupBy()", () => {
    const data = [
      {value: 1, myGroup: 'a', yourGroup: 'c'},
      {value: 2, myGroup: 'a', yourGroup: 'c'},
      {value: 2, myGroup: 'a', yourGroup: 'd'},
      {value: 2, myGroup: 'a', yourGroup: 'd'},
      {value: 3, myGroup: 'b', yourGroup: 'c'},
      {value: 3, myGroup: 'b', yourGroup: 'c'},
      {value: 4, myGroup: 'b', yourGroup: 'd'},
      {value: 5, myGroup: 'b', yourGroup: 'd'},
    ];

    it("groups the data by field", () => {
      const groups = Group.groupBy(data, 'myGroup');
      expect(groups).to.have.length(2);
      expect(groups[0].key).to.equal('a');
      expect(groups[1].key).to.equal('b');
      expect(groups[0]).to.have.property('items');
      expect(groups[1]).to.have.property('items');
      expect(groups[0].items).to.have.length(4);
      expect(groups[1].items).to.have.length(4);
    })
  })


});

import {expect} from 'chai';
import handlebars from 'handlebars';
import * as general from '../../src/domain/reports/generalListTemplate';
import * as helpers from '../../src/domain/reports/generalListTemplate/helpers';

describe("Reports | GeneralListTemplate", () => {
  describe.skip("normalizeGroups", () => {
    it("returns an array of groups", () => {
      const groupings = [{}, {}];
      const newGroupings = general.normalizeGroups(groupings, {});
      expect(newGroupings).to.be.an.instanceof(Array);
      expect(newGroupings).to.have.length(2);
    });

    it("adds columns to the groupsings", () => {
      const groupings = [{}, {}];
      const newGroupings = general.normalizeGroups(groupings, {columns: 123});
      expect(newGroupings).to.be.an.instanceof(Array);
      expect(newGroupings[0].columns).to.equal(123);
      expect(newGroupings[1].columns).to.equal(123);
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
      const groups = general.groupBy(data, 'myGroup');
      expect(groups).to.have.length(2);
      expect(groups[0].key).to.equal('a');
      expect(groups[1].key).to.equal('b');
      expect(groups[0]).to.have.property('items');
      expect(groups[1]).to.have.property('items');
      expect(groups[0].items).to.have.length(4);
      expect(groups[1].items).to.have.length(4);
    })
  })

  describe("groupGet()", () => {
    it("Gets a property on the object", () => {
      const group = {thing: 123}
      expect(helpers.groupGet(group, 'thing')).to.equal(123);
    });




  })

  describe("sumArgs()", () => {
    it("sums from group paramters", () => {
      const group = {
        groups: {
          thing1: {total: 1},
          thing2: {total: 2},
        }
      }

      const sum = helpers.sumArgs(group, 'thing1.total', 'thing2.total');
      expect(sum).to.equal(3);
    })
    it("sums with negative number from group paramters", () => {
      const group = {
        groups: {
          thing1: {total: 1},
          thing2: {total: 2},
        }
      }

      const sum = helpers.sumArgs(group, '-thing1.total', 'thing2.total');
      expect(sum).to.equal(1);
    })
  })

  describe("getColumn()", () => {
    const {getColumn} = helpers;
    handlebars.registerHelper('getColumn', getColumn);

    it("gets a column from the current group", () => {
      const group = {
        aggregates: [{sum: 123}]
      }
      const context = {
        currentColumn:0,
        group: group,
      }
      const html = handlebars.compile("{{getColumn 'sum'}}")(context);
      expect(html).to.equal('123');
    })

    it("gets a column from the current group in the second column", () => {
      const group = {
        aggregates: [{sum: 123},{sum: 456}]
      }
      const context = {
        currentColumn:1,
        group: group,
      }
      const html = handlebars.compile("{{getColumn 'sum'}}")(context);
      expect(html).to.equal('456');
    })
    it("gets a column from a nested group", () => {
      const group = {
        groups: [
          {
            key: 'myGroup1',
            aggregates: [{sum:123}]
          },
          {
            key: 'myGroup2',
            aggregates: [{sum:456}]
          }
        ],
        aggregates: [{sum: 1},{sum: 2}]
      }
      const context = {
        currentColumn:0,
        group: group,
      }
      const html = handlebars.compile("{{getColumn 'myGroup2.sum'}}")(context);
      expect(html).to.equal('456');
    })
  });

});

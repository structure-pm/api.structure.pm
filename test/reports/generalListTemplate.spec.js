import {expect} from 'chai';
import * as general from '../../src/domain/reports/generalListTemplate';
import * as helpers from '../../src/domain/reports/generalListTemplate/helpers';

describe.only("Reports | GeneralListTemplate", () => {
  describe("normalizeGroups", () => {
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
      expect(groups).to.have.property('a');
      expect(groups).to.have.property('b');
      expect(groups.a).to.have.property('items');
      expect(groups.b).to.have.property('items');
      expect(groups.a.items).to.have.length(4);
      expect(groups.b.items).to.have.length(4);
    })
  })

  describe("groupGet()", () => {
    it("Gets a property on the object", () => {
      const group = {thing: 123}
      expect(helpers.groupGet(group, 'thing')).to.equal(123);
    });

    // it("Gets a property on the _properties object", () => {
    //   const group = new Group();
    //   group._properties.thing1 = 1;
    //   expect(group.get('thing1')).to.equal(1);
    // });
    //
    // it("evaluates functions on the properties object", () => {
    //   const group = new Group({
    //     properties: {thing1: function() {return 123}}
    //   });
    //   expect(group.get('thing1')).to.equal(123);
    // });

    // it("passes the group as an argument to the function", () => {
    //   const group = new Group({
    //     properties: {
    //       thing1: 123,
    //       thing2: grp => grp.get('thing1') + 1,
    //     }
    //   });
    //   const thing1 = group.get('thing1');
    //   const thing2 = group.get('thing2');
    //   expect(thing1).to.equal(123);
    //   expect(thing2).to.equal(thing1 + 1);
    // });

    it("searches subgroups", () => {
      const subGroup = {thing: 123};
      const group = {
        groups: {group1: subGroup}
      }
      expect(helpers.groupGet(group, 'group1')).to.equal(subGroup);
    })

    it("gets properties on subgroups by path", () => {
      const subGroup = {thing: 123};
      const group = {groups: {group1: subGroup}};
      expect(helpers.groupGet(group, 'group1.thing')).to.equal(123);
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
});

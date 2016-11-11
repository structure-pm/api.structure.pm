import {expect} from 'chai';
import sqlFromMongo from '../../src/lib/sqlFromMongo';

describe("Lib | SqlFromMongo", () => {
  it("does a basic AND", () => {
    const s = sqlFromMongo({a:1, b:2});
    expect(s).to.equal("(a = 1 AND b = 2)")
  })

  it("IS (NOT) NULL", () => {
    const s1 = sqlFromMongo({a: {$isNull: true}})
    const s2 = sqlFromMongo({a: {$isNull: false}})
    expect(s1).to.equal("a IS NULL")
    expect(s2).to.equal("a IS NOT NULL")
  })
})

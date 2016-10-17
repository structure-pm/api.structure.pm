import {expect} from 'chai';
import engine from '../../src/domain/reports/engine';

describe("engine", () => {
  describe('sandboxEval()', () => {
    it("evaluates a string", () => {
      const result = engine.sandboxEval('1+2');
      expect(result).to.equal(3);
    })
  });
})

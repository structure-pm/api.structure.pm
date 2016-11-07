import {expect} from 'chai';
import Promise from 'bluebird';
import * as db from '../../src/db';
import config from '../../src/config';
import TenantRepo from '../../src/domain/tenant/tenant.repository';
import LeaseRepo from '../../src/domain/tenant/lease.repository';
import OwnerRepo from '../../src/domain/assets/owner.repository';
import Tenants from '../../src/domain/tenant';

describe.only("Tenant | Service", () => {
  const ownerID = 'testOwner';
  const locationID = 'testLocation';
  let unitID, tenant, owner, lease;

  before(done => {
    db.init(config, {force: true});
    expect(db.getPrefix()).to.equal('structutest');

    tenant = TenantRepo.create({
      firstName: 'Tester',
      lastName: 'Jones',
      rentBalance: 100,
      feeBalance: 200
    });

    owner = OwnerRepo.create({
      ownerID: ownerID,
      lName: 'TestCo',
      ledgerBalance: 1000,
    });

    lease = LeaseRepo.create({
      ownerID: ownerID
    });

    return Promise.all([
      db.query(`INSERT INTO structutest_assets.location (locationID, ownerID) VALUES ('${locationID}', '${ownerID}')`),
      db.query(`INSERT INTO structutest_assets.unit (locationID) VALUES ('${locationID}')`),
      TenantRepo.save(tenant),
      OwnerRepo.save(owner),
    ])
      .spread((l,u,t,o) => {
        unitID = u.insertId; tenant = t; owner = o;
        lease.tenantID = t.id;
        lease.unitID = unitID;
        return LeaseRepo.save(lease);
      })
      .then(lse => lease = lse)
      .then(() => done())
      .catch(done);

  })

  after(done => {
    Promise.all([
      db.query(`TRUNCATE TABLE structutest_assets.owner`),
      db.query(`TRUNCATE TABLE structutest_assets.tenant`),
      db.query(`TRUNCATE TABLE structutest_assets.lease`),
      db.query(`TRUNCATE TABLE structutest_assets.unit`),
      db.query(`TRUNCATE TABLE structutest_assets.location`),
      db.query(`TRUNCATE TABLE structutest_income.iLedger`),
      // db.query(`TRUNCATE TABLE structutest_expenses.vendor`),
      // db.query(`TRUNCATE TABLE structutest_imports.imported_unknown_account`),
      // db.query(`TRUNCATE TABLE structutest_imports.imported_account_asset`),
      // db.query(`TRUNCATE TABLE structutest_log.google_cloud_objects`),
    ])
      .then(() => db.end() )
      .then(() => done())
      .catch(done);
  });

  describe("makePaymentsOnLease()", () => {
    const amtSum = (sum, income) => sum + income.amount;
    const payments = [
      {incomeID: 1, amount: 10, isAdjustment: false, isFee: false},
      {incomeID: 1, amount: 20, isAdjustment: true, isFee: false},
      {incomeID: 1, amount: 30, isAdjustment: false, isFee: true},
    ];

    it("makes a multiple payments without error", done => {
      Tenants.makePaymentsOnLease(lease, payments)
        .then(incomes => {
          expect(incomes.length).to.equal(3);
          done();
        })
        .catch(done);
    })

    it("adds payment entries to the db", done => {
      db.query(`SELECT * FROM structutest_income.iLedger`)
        .then(incomes => {
          expect(incomes.length).to.equal(3);
          expect(incomes.reduce(amtSum)).to.equal(payments.reduce(amtSum));
          done();
        })
        .catch(done);
    })

    it("updates the owner balance", done => {
      done();
    })

    it("updates the tenant balance", done => {
      done();
    })

    it("rolls back when there is an error", done => {
      done();
    })
  });
});

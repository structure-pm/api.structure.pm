import {expect} from 'chai';
import Promise from 'bluebird';
import * as db from '../../src/db';
import config from '../../src/config';
import TenantRepo from '../../src/domain/tenant/tenant.repository';
import LeaseRepo from '../../src/domain/tenant/lease.repository';
import OwnerRepo from '../../src/domain/assets/owner.repository';
import Tenants from '../../src/domain/tenant';

describe("Tenant | Service", () => {
  const ownerID = 'testOwner',
        ownerStartingBalance = 1000,
        tenantStartingRentBalance = 100,
        tenantStartingFeeBalance = 200;
  const locationID = 'testLocation';
  let unitID, tenant, owner, lease;

  before(done => {
    db.init(config, {force: true});
    expect(db.getPrefix()).to.equal('structutest');

    tenant = TenantRepo.create({
      firstName: 'Tester',
      lastName: 'Jones',
      rentBalance: tenantStartingRentBalance,
      feeBalance: tenantStartingFeeBalance
    });

    owner = OwnerRepo.create({
      ownerID: ownerID,
      lName: 'TestCo',
      ledgerBalance: ownerStartingBalance,
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
      db.query(`TRUNCATE TABLE structutest_income.receivedPayment`),
      // db.query(`TRUNCATE TABLE structutest_expenses.vendor`),
      // db.query(`TRUNCATE TABLE structutest_imports.imported_unknown_account`),
      // db.query(`TRUNCATE TABLE structutest_imports.imported_account_asset`),
      // db.query(`TRUNCATE TABLE structutest_log.google_cloud_objects`),
    ])
      .then(() => db.end() )
      .then(() => done())
      .catch(done);
  });

  describe("receivePayment()", () => {
    let paymentData, receivedPayment;
    let paySum;


    before(() => {
      paymentData = {
        leaseID: lease.id,
        paymentDate: new Date(),
        lines: [
          {amount: 10, incomeID: 1},
          {amount: 20, incomeID: 1},
          {amount: 30, incomeID: 1},
        ]
      }
      paySum = 60;
    })

    it("receives the payment without error", done => {
      Tenants.receivePayment(lease, paymentData)
        .then(payment => {
          expect(payment).to.be.ok;
          expect(payment.amount).to.equal(60);
          expect(payment.id).to.be.ok;
          receivedPayment = payment;
          done();
        })
        .catch(done);
    });

    it("adds payment entries to the db", done => {
      db.query(`SELECT * FROM structutest_income.iLedger`)
        .then(incomes => {
          expect(incomes.length).to.equal(3);
          incomes.forEach(income => {
            expect(income.leaseID).to.equal(lease.leaseID);
            expect(income.receivedPaymentId).to.equal(receivedPayment.id);
          })
          done();
        })
        .catch(done);
    })

    it("updates the owner balance", done => {
      const expectedLedgerBalance = ownerStartingBalance + paySum;
      db.query(`SELECT ledgerBalance from structutest_assets.owner where ownerID='${ownerID}'`)
        .then(owners => {
          const owner = owners[0];
          expect(owner).to.be.ok;
          expect(owner.ledgerBalance).to.equal(expectedLedgerBalance);
          done();
        })
        .catch(done);
    })

    it("updates the tenant balance", done => {
      const expectedBalance = tenantStartingRentBalance + tenantStartingFeeBalance - paySum;
      db.query(`SELECT rentBalance, feeBalance from structutest_assets.tenant where tenantID=${tenant.tenantID}`)
        .then(tenants => {
          const tenant = tenants[0];
          expect(tenant).to.be.ok;
          expect(tenant.rentBalance + tenant.feeBalance).to.equal(expectedBalance);
          done();
        })
        .catch(done);
    })
    describe("When things go bad", () => {
      before(done => {
        Promise.all([
          db.query(`UPDATE structutest_assets.tenant SET rentBalance=${tenantStartingRentBalance}, feeBalance=${tenantStartingFeeBalance} where tenantID=${tenant.id}`),
          db.query(`UPDATE structutest_assets.owner SET ledgerBalance=${ownerStartingBalance} WHERE ownerID='${ownerID}'`),
          db.query(`TRUNCATE TABLE structutest_income.iLedger`),
        ])
          .then(() => done())
          .catch(done);
      })

      it("rolls back when there is an error", done => {
        const mockOwnerRepo = Object.assign({}, OwnerRepo, {
          save: function() { return Promise.reject(new Error("Owner Save Error"))}
        });
        return done(new Error("MyISAM tables don't do transactions!!!!"))

        Tenants.__Rewire__('OwnerRepo', mockOwnerRepo);
        db.query('SELECT * FROM structutest_income.iLedger')
          .then(incomes => {
            expect(incomes.length).to.equal(0);
          })
          .then(() => Tenants.makePaymentsOnLease(lease, payments) )
          .then(incomes => {
            done(new Error("Should have thrown an error"));
          })
          .catch(err => err )
          .then(() => db.query('SELECT * FROM structutest_income.iLedger'))
          .then(incomes => {
            expect(incomes.length).to.equal(0);
            return db.query(`SELECT * FROM structutest_assets.tenant WHERE tenantID=${tenant.id}`)
          })
          .then(tenants => {
            expect(tenants.length).to.equal(1);
            expect(tenants[0].rentBalance).to.equal(tenantStartingRentBalance);
            expect(tenants[0].feeBalance).to.equal(tenantStartingFeeBalance);
            return db.query(`SELECT * FROM structutest_assets.owner WHERE ownerID='${ownerID}'`)
          })
          .then(owners => {
            expect(owners.length).to.equal(1);
            expect(owners[0].ledgerBalance).to.equal(ownerStartingBalance);
          })
          .then(() => {
            Assets.__ResetDependency__('OwnerRepo');
            done();
          })
          .catch(done);
      })
    })
  });
});

import Promise from 'bluebird';
import * as db from '../../db';


const Repo = {};
export default Repo;

Repo.getOwnerUndeposited = function(ownerID, options={}) {
  const iLedgerTable  = db.getPrefix() + "_income.iLedger";
  const paymentTable  = db.getPrefix() + "_income.receivedPayment";
  const incomeTable   = db.getPrefix() + "_income.income";
  const leaseTable    = db.getPrefix() + "_assets.lease";
  const unitTable     = db.getPrefix() + "_assets.unit";
  const locationTable = db.getPrefix() + "_assets.location";
  const ownerTable    = db.getPrefix() + "_assets.owner";
  const tenantTable   = db.getPrefix() + "_assets.tenant";

  const iLedgerSelect = `
    SELECT
      il.entryID,
      NULL as receivedPaymentId,
      il.dateStamp as paymentDate,
      COALESCE(
        CONCAT_WS(' ', ten.firstName, ten.lastName),
        inc.type
      ) as payer,
      COALESCE(
        CONCAT(loc.streetNum, ' ', loc.street, ' (', uni.suiteNum, ')'),
        CONCAT_WS(' ', loc.streetNum, loc.street),
        COALESCE(own.lName, own.company, own.nickname, own.ownerID)
      ) as location,
      il.amount,
      il.comment
    FROM
      ${iLedgerTable} il
      LEFT JOIN ${leaseTable} lse on lse.leaseID = il.leaseID
      LEFT JOIN ${unitTable} uni on uni.unitID = lse.unitID
      LEFT JOIN ${locationTable} loc on loc.locationID = COALESCE(il.locationID, uni.locationID)
      LEFT JOIN ${ownerTable} own on own.ownerID = COALESCE(il.accountID, loc.ownerID)
      LEFT JOIN ${incomeTable} inc on inc.incomeID = il.incomeID
      LEFT JOIN ${tenantTable} ten on ten.tenantID = lse.tenantID
    WHERE
      il.adjustment = 0
      AND il.feeAdded = 0
      AND il.deposited = 0
      AND il.depID IS NULL
      AND il.receivedPaymentId IS NULL
      AND own.ownerID = ${db.escape(ownerID)}
  `;

  const paymentSelect = `
    SELECT
      NULL as entryID,
      id as receivedPaymentId,
      pay.paymentDate,
      COALESCE(
        CONCAT_WS(' ', ten.firstName, ten.lastName),
        'Received Payment'
      ) as payer,
      COALESCE(
        CONCAT(loc.streetNum, ' ', loc.street, ' (', uni.suiteNum, ')'),
        CONCAT_WS(' ', loc.streetNum, loc.street),
        COALESCE(own.lName, own.company, own.nickname, own.ownerID)
      ) as location,
      pay.amount,
      CONCAT_WS(' ', pay.comment, CONCAT('(', pay.items, ' items)')) as comment
    FROM
      ${paymentTable} pay
      LEFT JOIN ${leaseTable} lse on lse.leaseID = pay.leaseID
      LEFT JOIN ${unitTable} uni on uni.unitID = lse.unitID
      LEFT JOIN ${locationTable} loc on loc.locationID = COALESCE(pay.locationID, uni.locationID)
      LEFT JOIN ${ownerTable} own on own.ownerID = COALESCE(pay.accountID, loc.ownerID)
      LEFT JOIN ${tenantTable} ten on ten.tenantID = lse.tenantID
    WHERE
      own.ownerID = ${db.escape(ownerID)}
      AND pay.depID IS NULL
  `

  const query = `SELECT * FROM (${iLedgerSelect} UNION ALL ${paymentSelect}) undep ORDER BY paymentDate`;
  return db.query(query, options);
}


// Note: this is terrible, just a terrible way of incementing an ID field
// It requires a larger refactor to add a Deposit entity.
// TODO: Refactor deposits
Repo.getNextDepID = function() {
  const iLedgerTable = db.getPrefix() + '_income.iLedger';
  const query = `SELECT MAX(depID) as lastDepID FROM ${iLedgerTable}`;
  return db.query(query)
    .then(rows => rows[0].lastDepID)
    .then(maxDepID => parseInt(maxDepID) + 1);
}

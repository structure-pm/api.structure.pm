import * as db from '../../db';
import LeaseRepo from '../tenant/lease.repository';

const Read = {};
export default Read;


Read.getTotalAccruedRentForTenant = function(tenant, currentLease) {
  const tenantID = tenant.id;
  const ownerID = currentLease.ownerID;
  const prefix = db.getPrefix();
  const rentSQL = getAccruedRentSQL(tenantID);
  const recurSQL = getRecurringEntriesSQL(tenantID);
  const entriesSQL = `${rentSQL} UNION ALL ${recurSQL}`;
  const sql = `SELECT
      ent.incomeID,
      inc.type as type,
      COALESCE(SUM(ent.credit), 0) as credits,
      COALESCE(SUM(ent.debit), 0) as debits,
      COALESCE(SUM(ent.credit),0) - COALESCE(SUM(ent.debit),0) as total
    FROM (${entriesSQL}) ent
      JOIN ${prefix}_assets.unit u on u.unitID = ent.unitID
      JOIN ${prefix}_assets.deed d on d.locationID = u.locationID
      LEFT JOIN ${prefix}_income.income inc on inc.incomeID = ent.incomeID
    WHERE
      ent.dateStamp <= NOW()
      AND d.ownerID = '${ownerID}'
    GROUP BY ent.incomeID, inc.type`;

  console.log(sql);

  return db.query(sql);
}

function getAccruedRentSQL(tenantID) {
  const prefix = db.getPrefix();

  // Monthly rent EXCLUDING the first month's rent
  // The exclusion is accomplished by joining dates to lease on
  // dates.day > startDate, NOT >=.  **the more you know**
  const sql = `SELECT
    lse.leaseID,
    lse.startDate as dateStamp,
    lse.rent as credit,
    NULL as debit,
    1 as incomeID,
    'Rent (first month)' as comment,
    lse.unitID
  FROM ${prefix}_assets.lease lse
  WHERE
    DAY(lse.startDate) <= 15
    AND lse.tenantID = ${tenantID}

  UNION ALL

  SELECT
    lse.leaseID,
    dates.day as dateStamp,
    lse.rent as credit,
    NULL as debit,
    1 as incomeID,
    'Rent' as comment,
    lse.unitID
  FROM ${prefix}_assets.lease lse
    LEFT JOIN ${prefix}_log.dates dates
      on dates.day > lse.startDate
      -- Continue to charge rent so long as the lease is marked "active"
      AND (
        (lse.active = 1 and dates.day <= NOW())
        OR dates.day < lse.endDate
      )
  WHERE lse.tenantID = ${tenantID}`;

  return sql;
}

function getRecurringEntriesSQL(tenantID) {
  const prefix = db.getPrefix();

  const sql = `-- Monthly recurring fees and credits
  SELECT
    lse.leaseID,
    dates.day as dateStamp,
    CASE WHEN rle.isCredit THEN rle.amount ELSE NULL END as credit,
    CASE WHEN rle.isCredit THEN NULL ELSE rle.amount END as debit,
    rle.incomeID as incomeID,
    rle.name as comment,
    lse.unitID
  FROM ${prefix}_assets.lease lse
    LEFT JOIN ${prefix}_log.dates dates
      on dates.day > lse.startDate
      -- Continue to charge recurring fees so long as the lease is marked "active"
      AND (
        (lse.active = 1 and dates.day <= NOW())
        OR dates.day < lse.endDate
      )
    LEFT JOIN ${prefix}_assets.recurringLeaseEntries rle
      on rle.leaseID = lse.leaseID
      AND rle.startDate <= dates.day
      -- Continue to charge recurring fees so long as the lease is marked "active"
      AND (
        (lse.active = 1 and dates.day <= NOW())
        OR rle.endDate >= dates.day
      )
  WHERE
    lse.tenantID = ${tenantID}
    AND rle.name IS NOT NULL

  UNION ALL

  -- First month's "prorated" recurring fees and credits (see "prorated" rent)
  SELECT
    lse.leaseID,
    lse.startDate as dateStamp,
    CASE WHEN rle.isCredit THEN rle.amount ELSE NULL END as credit,
    CASE WHEN rle.isCredit THEN NULL ELSE rle.amount END as debit,
    rle.incomeID as incomeID,
    rle.name as comment,
    lse.unitID
  FROM ${prefix}_assets.lease lse
    LEFT JOIN ${prefix}_assets.recurringLeaseEntries rle
      on rle.leaseID = lse.leaseID
      AND rle.startDate <= lse.startDate
      AND rle.endDate >= lse.startDate
  WHERE
    lse.tenantID = ${tenantID}
    AND rle.name IS NOT NULL
    AND DAY(lse.startDate) <= 15`;

  return sql;
}


/**
 * Group and sum all the fees for a given tenant across ALL their leases
 *
 * Takes in to account adjustments, but NOT payments.  Payments will need
 * to be handled separately since, for quite some time, fee payments and
 * rent payments were shoved in to the same GLAccount
 *
 * @param  {Number} leaseID
 * @return {Promise<Array>}         Collection of fee totals of the form:
 *   {
 *   	incomeID, (possibly NULL)
 *   	name,
 *   	total
 *   }
 */
Read.getFeesAndAdjustmentsForTenant = function(tenant) {
  const prefix = db.getPrefix();
  const tenantID = tenant.id;
  const leaseIDs = LeaseRepo.find({tenantID}).map(lse => lse.leaseID);
  // Fees and adjustments with a null incomeID will be shoved in to 'Rent',
  // as has been the defacto practice for some time
  return leaseIDs.then(leaseIDs => {
    const query = `
      SELECT
        COALESCE(il.incomeID,1) as incomeID,
        inc.type as name,
        SUM(CASE WHEN il.feeAdded = 1 THEN il.amount ELSE -1*il.amount END) as total
      FROM
        ${prefix}_income.iLedger il
        LEFT JOIN ${prefix}_income.income inc on inc.incomeID = COALESCE(il.incomeID,1)
      WHERE
        (il.feeAdded = 1 OR il.adjustment = 1)
        AND leaseID in (${leaseIDs.join(',')})
      GROUP BY
        COALESCE(il.incomeID,1), inc.type`;

    return db.query(query);
  });
}

Read.getPaymentsForTenant = function(tenant) {
  const prefix = db.getPrefix();
  const tenantID = tenant.id;
  const leaseIDs = LeaseRepo.find({tenantID}).map(lse => lse.leaseID);
  // Fees and adjustments with a null incomeID will be shoved in to 'Rent',
  // as has been the defacto practice for some time
  return leaseIDs.then(leaseIDs => {
    const query = `
      SELECT
        COALESCE(il.incomeID,1) as incomeID,
        inc.type as name,
        -1* SUM(il.amount) as total -- payment will reduce the balance, hence -1
      FROM
        ${prefix}_income.iLedger il
        LEFT JOIN ${prefix}_income.income inc on inc.incomeID = COALESCE(il.incomeID,1)
      WHERE
        (il.feeAdded = 0 AND il.adjustment = 0)
        AND leaseID in (${leaseIDs.join(',')})
      GROUP BY
        COALESCE(il.incomeID,1), inc.type`;

    return db.query(query);
  });
}

Read.getLeasePeriodsForTenant = function(tenant) {
  const prefix = db.getPrefix();
  const tenantID = tenant.id;
  // Note about the MTM thing below.
  // Active Month-to-month leases will have an endDate set (often 1 month after
  // the lease starts).  So the endDate of active MTMs is the end of the current
  // month.  Once a MTM ends, the endDate is updated to the actual endDate
  const query = `
    SELECT
      lse.leaseID,
      lse.rent,
      lse.active,
      CASE WHEN lse.startDate > l.addedWhen THEN lse.startDate ELSE l.addedWhen END as startDate,
      CASE WHEN lse.agreement = 'MTM' AND lse.active=1 THEN LAST_DAY(NOW()) ELSE lse.endDate END as endDate
    FROM
      ${prefix}_assets.lease lse
      JOIN ${prefix}_assets.unit u on u.unitID = lse.unitID
      JOIN ${prefix}_assets.location l on l.locationID = u.locationID
    WHERE
      lse.tenantID = ${tenantID}
  `;

  return db.query(query);
}

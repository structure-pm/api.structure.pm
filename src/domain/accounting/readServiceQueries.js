import * as db from '../../db';
import LeaseRepo from '../tenant/lease.repository';

const ReadSql = {};
export default ReadSql;


ReadSql.getTotalAccruedRentForTenant = function(tenant, currentLease) {
  const tenantID = tenant.id;
  const ownerID = currentLease.ownerID;
  const prefix = db.getPrefix();
  const rentSQL = getAccruedRentSQL(tenantID);
  const recurSQL = getRecurringEntriesSQL(tenantID);
  const entriesSQL = `${rentSQL} UNION ALL ${recurSQL}`;
  const sql = `SELECT
      ent.incomeID,
      inc.type as incomeType,
      COALESCE(SUM(ent.credit), 0) as credits,
      COALESCE(SUM(ent.debit), 0) as debits,
      COALESCE(SUM(ent.credit),0) - COALESCE(SUM(ent.debit),0) as total
    FROM (${entriesSQL}) ent
      JOIN ${prefix}_assets.unit u on u.unitID = ent.unitID
      JOIN ${prefix}_assets.deed d
        on d.locationID = u.locationID
        -- Even if a lease begins before the deed, only start charging
				-- the tenant account within the deed period.  IOW, the time period
				-- for which we charge the tenant is the intersection of the lease
				-- period and the deed period.
				AND d.startDate <= ent.dateStamp
				AND (d.endDate >= ent.dateStamp OR d.endDate IS NULL)
      LEFT JOIN ${prefix}_income.income inc on inc.incomeID = ent.incomeID
    WHERE
      ent.dateStamp <= NOW()
      AND d.ownerID = '${ownerID}'
    GROUP BY ent.incomeID, inc.type`;

  return db.query(sql);
}

ReadSql.accruedRentForTenant = function(tenantID) {
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

ReadSql.tenantLeaseDatesSQL = function(tenantID) {
  const prefix = db.getPrefix();

	const query = `SELECT
			dates.day, MIN(lse.leaseID) as leaseID
		FROM ${prefix}_log.dates dates
			JOIN ${prefix}_assets.lease lse
				ON lse.startDate <= dates.day
				-- Continue to charge rent so long as the lease is marked 'active'
				AND (
					(lse.active = 1 and dates.day <= NOW())
					OR lse.endDate >= dates.day
				)
		WHERE
			lse.tenantID = ${tenantID}
		GROUP BY dates.day
		ORDER BY dates.day`;

	return query;
}

ReadSql.recurringEntriesForTenant = function(tenantID) {
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
        OR (rle.endDate >= dates.day OR rle.endDate IS NULL)
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
      AND (rle.endDate >= lse.startDate OR rle.endDate IS NULL)
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
ReadSql.getFeesAndAdjustmentsForLeases = function(leaseIDs) {
  if (!Array.isArray(leaseIDs)) leaseIDs = [leaseIDs];
  const prefix = db.getPrefix();

  // Fees and adjustments with a null incomeID will be shoved in to 'Rent',
  // as has been the defacto practice for some time
  const query = `
    SELECT
      il.entryID, il.leaseID, il.dateStamp, il.amount,
      COALESCE(il.incomeID,1) as incomeID,
      il.adjustment, il.feeAdded, il.comment,
      inc.type as incomeType
    FROM
      ${prefix}_income.iLedger il
        LEFT JOIN ${prefix}_income.income inc on inc.incomeID = COALESCE(il.incomeID,1)
    WHERE
      (il.feeAdded = 1 OR il.adjustment = 1)
      AND il.leaseID in (${leaseIDs.join(',')})
    `;

  return query;
}

ReadSql.getPaymentsForLeases = function(leaseIDs) {
  if (!Array.isArray(leaseIDs)) leaseIDs = [leaseIDs];
  const prefix = db.getPrefix();
  // Fees and adjustments with a null incomeID will be shoved in to 'Rent',
  // as has been the defacto practice for some time
  const query = `
    SELECT
      il.entryID, il.leaseID, il.dateStamp, il.amount,
      COALESCE(il.incomeID,1) as incomeID,
      il.adjustment, il.feeAdded, il.comment,
      inc.type as incomeType
    FROM
      ${prefix}_income.iLedger il
      LEFT JOIN ${prefix}_income.income inc on inc.incomeID = COALESCE(il.incomeID,1)
    WHERE
      (il.feeAdded = 0 AND il.adjustment = 0)
      AND il.leaseID in (${leaseIDs.join(',')})
    `;

  return query;
}

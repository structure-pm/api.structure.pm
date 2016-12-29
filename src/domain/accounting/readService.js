import * as db from '../../db';
import LeaseRepo from '../tenant/lease.repository';
import ReadSql from './readServiceQueries';

const Read = {};
export default Read;


Read.getTotalAccruedRentForTenant = function(tenant, currentLease) {
  const tenantID = tenant.id;
  const ownerID = currentLease.ownerID;
  const prefix = db.getPrefix();
  const rentSQL = ReadSql.accruedRentForTenant(tenantID);
  const recurSQL = ReadSql.recurringEntriesForTenant(tenantID);
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
        -- Deed start dates are treated similarly to lease start dates:
        -- If a deed starts before the 15th, charge the full amount for
        -- that month; Otherwise do not charge anything
				AND (
          (DAY(d.startDate) <= 15 AND DATE_SUB(d.startDate, INTERVAL (DAY(d.startDate)-1) DAY) <= ent.dateStamp)
          OR
          (DAY(d.startDate) > 15 AND d.startDate <= ent.dateStamp)
        )
				AND (d.endDate >= ent.dateStamp OR d.endDate IS NULL)
      LEFT JOIN ${prefix}_income.income inc on inc.incomeID = ent.incomeID
    WHERE
      ent.dateStamp <= NOW()
    GROUP BY ent.incomeID, inc.type`;

  return db.query(sql);
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
    const feesAndAdjustments = ReadSql.getFeesAndAdjustmentsForLeases(leaseIDs);
    const query = `
      SELECT
        ent.incomeID,
        ent.incomeType,
        SUM(CASE WHEN ent.feeAdded = 1 THEN ent.amount ELSE -1*ent.amount END) as total
      FROM
        (${feesAndAdjustments}) ent
        JOIN ${prefix}_assets.lease lse on lse.leaseID = ent.leaseID
        JOIN ${prefix}_assets.unit u on u.unitID = lse.unitID
        JOIN ${prefix}_assets.deed d
          on d.locationID = u.locationID
          -- Deed start dates are treated similarly to lease start dates:
          -- If a deed starts before the 15th, charge the full amount for
          -- that month; Otherwise do not charge anything
  				AND (
            (DAY(d.startDate) <= 15 AND DATE_SUB(d.startDate, INTERVAL (DAY(d.startDate)-1) DAY) <= ent.dateStamp)
            OR
            (DAY(d.startDate) > 15 AND d.startDate <= ent.dateStamp)
          )
					AND (d.endDate >= ent.dateStamp OR d.endDate IS NULL)
      GROUP BY
        ent.incomeID, ent.incomeType`;


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
    const payments = ReadSql.getPaymentsForLeases(leaseIDs);
    const query = `
      SELECT
        ent.incomeID,
        ent.incomeType,
        -- payment will reduce the balance, hence -1
        -1* SUM(ent.amount) as total
      FROM
        (${payments}) ent
        JOIN ${prefix}_assets.lease lse on lse.leaseID = ent.leaseID
        JOIN ${prefix}_assets.unit u on u.unitID = lse.unitID
        JOIN ${prefix}_assets.deed d
          on d.locationID = u.locationID
          -- Deed start dates are treated similarly to lease start dates:
          -- If a deed starts before the 15th, charge the full amount for
          -- that month; Otherwise do not charge anything
  				AND (
            (DAY(d.startDate) <= 15 AND DATE_SUB(d.startDate, INTERVAL (DAY(d.startDate)-1) DAY) <= ent.dateStamp)
            OR
            (DAY(d.startDate) > 15 AND d.startDate <= ent.dateStamp)
          )
          AND (d.endDate >= ent.dateStamp OR d.endDate IS NULL)
      GROUP BY
        ent.incomeID, ent.incomeType`;
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

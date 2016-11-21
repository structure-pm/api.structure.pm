import * as db from '../../db';
import LeaseRepo from '../tenant/lease.repository';

const Read = {};
export default Read;

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

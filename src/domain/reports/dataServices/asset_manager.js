// import Moment from 'moment';
import * as db from '../../../db';

export default function assetManagerReport(options) {
  const {reportDate, ownerIDs} = options;

  const unitStatsSql = unitStatsByOwner(options);
  const rentSql = rentByOwner(options);
  const leaseAddonsSql = leaseAddonsByOwner(options);
  const iLedgerSql = iLedgerByOwner(options);

  const leasesForActiveTenantsSql = leasesForActiveTenants(options);
  const tenantBalanceByOwnerSql = tenantBalanceByOwner(options);
  const accountsPayableByOwnerSql = accountsPayableByOwner(options);
  const openRepairsByOwnerSql = openRepairsByOwner(options);

  const sql = `SELECT
      *,
      tenantBalance.balance as tenant_balance
    FROM
      (${unitStatsSql}) as units
      LEFT JOIN (${tenantBalanceByOwnerSql}) as tenantBalance ON tenantBalance.ownerID = units.ownerID
      LEFT JOIN (${accountsPayableByOwnerSql}) as ap ON ap.ownerID = units.ownerID
      LEFT JOIN (${openRepairsByOwnerSql}) as openRepairs ON openRepairs.ownerID = units.ownerID
  `

  return db.query(sql).then(table => {
    return {
      data: table,
      count: table.length
    }
  });


}

function ownerIDTable({ownerIDs}) {
  return ownerIDs.map(oid => `SELECT '${oid}' as ownerID`).join(' UNION ALL ');
}


function unitStatsByOwner({reportDate, ownerIDs}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const sql = `SELECT
      d.ownerID,
      SUM(case WHEN u.active = 1 THEN 1 ELSE 0 END) as units_count,
      SUM(CASE WHEN u.active = 1 && u.available = 1 THEN 1 ELSE 0 END) as available_count,
      SUM(CASE WHEN lse.leaseID IS NOT NULL THEN 1 ELSE 0 END) as active_lease_count,
      SUM(CASE WHEN lse.vacate_intent = 1 THEN 1 ELSE 0 END) as vacating_lease_count,
      SUM(COALESCE(lse.rent, 0)) as monthly_rent_amount,
      SUM(COALESCE(extraMonthly.amount, 0)) as monthly_adjustment_amount,
      SUM(COALESCE(lse.rent, 0) + COALESCE(extraMonthly.amount, 0)) as monthly_total,
      SUM(ten.rentBalance + ten.feeBalance) as tenant_total_balance,
      SUM(ten.rentBalance) as tenant_rent_balance,
      SUM(ten.feeBalance) as tenant_fee_balance
    FROM ${dbPrefix}_assets.unit u
      LEFT JOIN ${dbPrefix}_assets.lease lse ON lse.unitID = u.unitID AND lse.active=1
      LEFT JOIN ${dbPrefix}_assets.tenant ten on ten.tenantID = lse.tenantID
      LEFT JOIN ${dbPrefix}_assets.deed d on d.locationID = u.locationID
      LEFT JOIN (
        SELECT leaseID, SUM(amount) as amount
        FROM ${dbPrefix}_assets.recurringLeaseEntries re
        WHERE startDate <= '${reportDate}' AND (endDate >= '${reportDate}' OR endDate IS NULL)
        GROUP BY leaseID
      ) as extraMonthly on extraMonthly.leaseID = lse.leaseID
    WHERE
      d.startDate <= '${reportDate}' AND (d.endDate >= '${reportDate}' OR d.endDate IS NULL)
      and d.ownerID in (${inOwnerIDs})
    GROUP BY
      d.ownerID`;

  return sql;
}

function tenantBalanceByOwner({reportDate, ownerIDs}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const sql = `SELECT
    d.ownerID,
    SUM(CASE WHEN t.rentBalance + t.feeBalance > 0 THEN t.rentBalance + t.feeBalance  ELSE 0 END) as balance
  FROM
    ${dbPrefix}_assets.tenant t
    LEFT JOIN ${dbPrefix}_assets.lease lse on lse.tenantID = t.tenantID
    LEFT JOIN ${dbPrefix}_assets.unit u on u.unitID = lse.unitID
    LEFT JOIN ${dbPrefix}_assets.deed d
      ON  d.locationID = u.locationID
      AND d.startDate <= lse.startDate
      AND (d.endDate >= lse.startDate OR d.endDate IS NULL)
  WHERE
    lse.active=1
    AND d.ownerID IN (${inOwnerIDs})
    AND d.startDate <= '${reportDate}'
    AND (d.endDate >= '${reportDate}' OR d.endDate IS NULL)
  GROUP BY
    d.ownerID`;

  return sql;
}


function accountsPayableByOwner({reportDate, ownerIDs}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const sql = `SELECT
    COALESCE(el.ownerID, r.ownerID, loc.ownerID, inv.billTo) as ownerID,
    count(*) as ap_count,
    SUM(CASE WHEN DATEDIFF(${reportDate}, el.dueDate) > 90 THEN 1 ELSE 0 END) as ap_over_90_count,
    SUM(CASE WHEN DATEDIFF(${reportDate}, el.dueDate) >= 60 AND DATEDIFF(${reportDate}, el.dueDate) < 90 THEN 1 ELSE 0 END) as ap_over_60_count,
    SUM(CASE WHEN DATEDIFF(${reportDate}, el.dueDate) >= 30 AND DATEDIFF(${reportDate}, el.dueDate) < 60 THEN 1 ELSE 0 END) as ap_over_30_count
  FROM
    ${dbPrefix}_expenses.eLedger el
      LEFT JOIN ${dbPrefix}_expenses.recurring r on r.recurringID = el.recurringID
      LEFT JOIN ${dbPrefix}_assets.unit u on u.unitID = el.unitID
      LEFT JOIN ${dbPrefix}_assets.location loc on loc.locationID = COALESCE(el.locationID, el.unitID)
      LEFT JOIN ${dbPrefix}_income.invoices inv on inv.invoiceID = el.invoiceID
  WHERE
    COALESCE(el.ownerID, r.ownerID, loc.ownerID, inv.billTo) in (${inOwnerIDs})
    AND (el.dateStamp IS NULL or el.payment IS NULL)
  GROUP BY
    COALESCE(el.ownerID, r.ownerID, loc.ownerID, inv.billTo)`;

  return sql
}


function openRepairsByOwner({reportDate, ownerIDs}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const sql = `SELECT
      COALESCE(p.ownerID, loc.ownerID) as ownerID,
      count(*) as open_repairs_count
    FROM
      ${dbPrefix}_log.page p
      LEFT JOIN
      (
        SELECT
          e.*
        FROM
          ${dbPrefix}_log.entry e
            LEFT JOIN ${dbPrefix}_log.entry earlier
              on e.pageID = earlier.pageID
              AND e.timeStamp < earlier.timeStamp
              AND DATE(earlier.timeStamp) <= '${reportDate}'
        WHERE
          DATE(e.timeStamp) <= '${reportDate}'
          AND earlier.pageID IS NULL
      ) ent on ent.pageID = p.pageID
      LEFT JOIN ${dbPrefix}_assets.unit u on u.unitID = p.unitID
      LEFT JOIN ${dbPrefix}_assets.location loc on loc.locationID = COALESCE(p.locationID, u.locationID)
    WHERE
      p.pageType = 'repair'
      AND ent.status < 5
      AND COALESCE(p.ownerID, loc.ownerID) in (${inOwnerIDs})
    GROUP BY
      COALESCE(p.ownerID, loc.ownerID) `;

  return sql;
}


function rentByOwner({reportDate, ownerIDs}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const leasesForActiveTenantsSql = leasesForActiveTenants({reportDate, ownerIDs});
  const sql = `SELECT ownerID, SUM(total) as total_rent FROM (
      SELECT leases.ownerID, SUM(leases.rent) as total
      FROM (${leasesForActiveTenantsSql}) as leases
      GROUP BY leases.ownerID

      UNION ALL

      SELECT lse.ownerID, SUM(lse.rent) as total
      FROM
        (${leasesForActiveTenantsSql}) lse
        LEFT JOIN ${dbPrefix}_log.dates dates
          on dates.day > lse.startDate
          -- Continue to charge rent so long as the lease is marked "active"
          AND (
            (lse.active = 1 and dates.day <= '${reportDate}')
            OR dates.day < lse.endDate
          )
      WHERE dates.day <= '${reportDate}'
      GROUP BY lse.ownerID
    ) as rents
    GROUP BY ownerID`;

  return sql;
}


function leaseAddonsByOwner({reportDate, ownerIDs}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const leasesForActiveTenantsSql = leasesForActiveTenants({reportDate, ownerIDs});
  const sql = `SELECT
      lse.ownerID,
      COALESCE(SUM(rle.amount),0) as total_rent_addons
    FROM
      (${leasesForActiveTenantsSql}) lse
      LEFT JOIN ${dbPrefix}_log.dates dates
        on dates.day > lse.startDate
        -- Continue to charge rent so long as the lease is marked "active"
        AND (
          (lse.active = 1 and dates.day <= '${reportDate}')
          OR dates.day < lse.endDate
        )
      LEFT JOIN ${dbPrefix}_assets.recurringLeaseEntries rle
        ON rle.leaseID = lse.leaseID
          AND (rle.startDate <= dates.day and (rle.endDate >= dates.day OR rle.endDate IS NULL))
    WHERE dates.day <= '${reportDate}'
    GROUP BY lse.ownerID`

  return sql;
}


function iLedgerByOwner({reportDate, ownerIDs}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const leasesForActiveTenantsSql = leasesForActiveTenants({reportDate, ownerIDs});
  const sql = `SELECT
    lse.ownerID,
    SUM(CASE WHEN il.feeAdded=1 THEN il.amount ELSE 0 END) as total_fees,
    SUM(CASE WHEN il.adjustment=1 THEN il.amount ELSE 0 END) as total_adjustments,
    SUM(CASE WHEN il.feeAdded!=1 AND il.adjustment!=1 THEN il.amount ELSE 0 END) as total_payments
  FROM
    (${leasesForActiveTenantsSql}) lse
    LEFT JOIN ${dbPrefix}_income.iLedger il on il.leaseID = lse.leaseID
  WHERE
    (il.incomeID=1 OR il.incomeID=61 OR il.incomeID is NULL)
  GROUP BY
    lse.ownerID`;

  return sql
}

function activeTenantList({ownerIDs, reportDate}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const sql = `SELECT DISTINCT
      lse.tenantID
    FROM
      ${dbPrefix}_assets.lease lse
      LEFT JOIN ${dbPrefix}_assets.unit u on u.unitID = lse.unitID
      LEFT JOIN ${dbPrefix}_assets.deed d on d.locationID = u.locationID
    WHERE
      d.startDate <= '${reportDate}' AND (d.endDate >= '${reportDate}' OR d.endDate IS NULL)
      AND lse.active=1
      AND d.ownerID IN (${inOwnerIDs})
  `;

  return sql;
}


function leasesForActiveTenants({ownerIDs, reportDate}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const activeTenantSql = activeTenantList({ownerIDs, reportDate});
  const sql = `SELECT
    d.ownerID,
    d.locationID,
    lse.unitID,
    lse.tenantID,
    lse.leaseID,
    lse.rent,
    lse.active,
    lse.startDate,
    lse.endDate
  FROM
    ${dbPrefix}_assets.lease lse
    LEFT JOIN ${dbPrefix}_assets.unit u on u.unitID = lse.unitID
    LEFT JOIN ${dbPrefix}_assets.deed d
      ON  d.locationID = u.locationID
      AND d.startDate <= lse.startDate
      AND (d.endDate >= lse.startDate OR d.endDate IS NULL)
    JOIN ( ${activeTenantSql} ) activeTenants on activeTenants.tenantID = lse.tenantID
  WHERE
    d.ownerID IN (${inOwnerIDs})
    AND d.startDate <= '${reportDate}'
    AND (d.endDate >= '${reportDate}' OR d.endDate IS NULL)`;

  return sql;

}

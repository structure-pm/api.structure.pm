// import Moment from 'moment';
import * as db from '../../../db';

export default function assetManagerReport(options) {
  const {reportDate, ownerIDs} = options;

  const unitStatsSql = unitStatsByOwner(options);
  const tenantBalanceByOwnerSql = tenantBalanceByOwner(options);
  const expensesByOwnerSql = expensesByOwner(options);
  const openRepairsByOwnerSql = openRepairsByOwner(options);
  const expenseByCategoryByOwnerSql = expenseByCategoryByOwner(options);

  const sql = `SELECT
      *,
      tenantBalance.balance as tenant_balance
    FROM
      (${unitStatsSql}) as units
      LEFT JOIN (${tenantBalanceByOwnerSql}) as tenantBalance ON tenantBalance.ownerID = units.ownerID
      LEFT JOIN (${expensesByOwnerSql}) as ap ON ap.ownerID = units.ownerID
      LEFT JOIN (${openRepairsByOwnerSql}) as openRepairs ON openRepairs.ownerID = units.ownerID
      LEFT JOIN (${expenseByCategoryByOwnerSql}) as exp ON exp.ownerID = units.ownerID
  `

  return db.query(sql).then(table => {
    return {
      data: table,
      count: table.length
    }
  });


}

function createOwnerIDTable({ownerIDs}) {
  return ownerIDs.map(oid => `SELECT '${oid}' as ownerID`).join(' UNION ALL ');
}


function unitStatsByOwner({reportDate, ownerIDs}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const sql = `SELECT
      d.ownerID,
      SUM(case WHEN u.active = 1 THEN 1 ELSE 0 END) as units_count,
      SUM(CASE WHEN u.active = 1 AND u.available = 1 THEN 1 ELSE 0 END) as available_count,
      SUM(CASE WHEN lse.leaseID IS NOT NULL THEN 1 ELSE 0 END) as active_lease_count,
      SUM(CASE WHEN lse.vacate_intent = 1 THEN 1 ELSE 0 END) as vacating_lease_count,
      SUM(COALESCE(lse.rent, 0)) as monthly_rent_amount,
      SUM(COALESCE(extraMonthly.amount, 0)) as monthly_adjustment_amount,
      SUM(COALESCE(lse.rent, 0) + COALESCE(extraMonthly.amount, 0)) as monthly_total,
      SUM(ten.rentBalance + ten.feeBalance) as tenant_total_balance,
      SUM(ten.rentBalance) as tenant_rent_balance,
      SUM(ten.feeBalance) as tenant_fee_balance,
      SUM(CASE WHEN
        u.active = 1
        AND lse.leaseID IS NULL
        AND DATEDIFF('${reportDate}', COALESCE(lastLease.endDate, '${reportDate}')) > 90
        THEN 1 ELSE 0 END) as vacant_over_90_count,
      SUM(CASE WHEN
        u.active = 1
        AND lse.leaseID IS NULL
        AND DATEDIFF('${reportDate}', COALESCE(lastLease.endDate, '${reportDate}')) >= 60
        AND DATEDIFF('${reportDate}', COALESCE(lastLease.endDate, '${reportDate}')) < 90
        THEN 1 ELSE 0 END) as vacant_over_60_count,
      SUM(CASE WHEN
        u.active = 1
        AND lse.leaseID IS NULL
        AND DATEDIFF('${reportDate}', COALESCE(lastLease.endDate, '${reportDate}')) >= 30
        AND DATEDIFF('${reportDate}', COALESCE(lastLease.endDate, '${reportDate}')) < 60
        THEN 1 ELSE 0 END) as vacant_over_30_count
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
      LEFT JOIN (
        SELECT
          lse.*
        FROM
          ${dbPrefix}_assets.lease lse
            LEFT JOIN ${dbPrefix}_assets.lease lastLse
              on lse.unitID = lastLse.unitID
              AND lse.leaseID < lastLse.leaseID
              AND lastLse.startDate <= '${reportDate}'
        WHERE
          lse.startDate <= '${reportDate}'
          and lastLse.leaseID IS NULL
      ) as lastLease on lastLease.unitID = u.unitID
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


function expensesByOwner({reportDate, ownerIDs}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const sql = `SELECT
    COALESCE(el.ownerID, r.ownerID, loc.ownerID, inv.billTo) as ownerID,
    SUM(CASE WHEN el.dateStamp IS NULL or el.payment IS NULL THEN 1 ELSE 0 END) as ap_count,
    SUM(CASE WHEN
      (el.dateStamp IS NULL or el.payment IS NULL)
      AND DATEDIFF('${reportDate}', el.dueDate) > 90 THEN 1 ELSE 0 END) as ap_over_90_count,
    SUM(CASE WHEN
      (el.dateStamp IS NULL or el.payment IS NULL)
      AND DATEDIFF('${reportDate}', el.dueDate) >= 60
      AND DATEDIFF('${reportDate}', el.dueDate) < 90 THEN 1 ELSE 0 END) as ap_over_60_count,
    SUM(CASE WHEN
      (el.dateStamp IS NULL or el.payment IS NULL)
      AND DATEDIFF('${reportDate}', el.dueDate) >= 30
      AND DATEDIFF('${reportDate}', el.dueDate) < 60 THEN 1 ELSE 0 END) as ap_over_30_count
  FROM
    ${dbPrefix}_expenses.eLedger el
      LEFT JOIN ${dbPrefix}_expenses.recurring r on r.recurringID = el.recurringID
      LEFT JOIN ${dbPrefix}_assets.unit u on u.unitID = el.unitID
      LEFT JOIN ${dbPrefix}_assets.location loc on loc.locationID = COALESCE(el.locationID, el.unitID)
      LEFT JOIN ${dbPrefix}_income.invoices inv on inv.invoiceID = el.invoiceID
  WHERE
    COALESCE(el.ownerID, r.ownerID, loc.ownerID, inv.billTo) in (${inOwnerIDs})
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

function expenseByCategoryByOwner({reportDate, ownerIDs}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const ownerIDsJoinTable = createOwnerIDTable({ownerIDs});
  const maintenanceIDs = expenseIDsFor('maintenance');
  const utilitiesIDs = expenseIDsFor('utilities');
  const operationsIDs = expenseIDsFor('operations');
  const capitalExpIDs = expenseIDsFor('capital');


  const maintenanceSql = expenseForTypesByOwner({reportDate, ownerIDs, expenseIDs: maintenanceIDs});
  const utilitiesSql = expenseForTypesByOwner({reportDate, ownerIDs, expenseIDs: utilitiesIDs});
  const operationsSql = expenseForTypesByOwner({reportDate, ownerIDs, expenseIDs: operationsIDs});
  const capitalExpSql = expenseForTypesByOwner({reportDate, ownerIDs, expenseIDs: capitalExpIDs});


  const sql = `SELECT
    owners.ownerID,
    COALESCE(maint.total, 0) as year_exp_maintenance_total,
    COALESCE(util.total, 0) as year_exp_utilities_total,
    COALESCE(oper.total, 0) as year_exp_operations_total,
    COALESCE(cap.total, 0) as year_exp_capexp_total
    FROM
      (${ownerIDsJoinTable}) owners
      LEFT JOIN (${maintenanceSql}) as maint on maint.ownerID = owners.ownerID
      LEFT JOIN (${utilitiesSql}) as util on util.ownerID = owners.ownerID
      LEFT JOIN (${operationsSql}) as oper on oper.ownerID = owners.ownerID
      LEFT JOIN (${capitalExpSql}) as cap on cap.ownerID = owners.ownerID
      `;

  return sql

}

function expenseForTypesByOwner({reportDate, ownerIDs, expenseIDs}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const inExpenseIDs = expenseIDs.join(',');
  const sql = `SELECT
      COALESCE(el.ownerID, r.ownerID, loc.ownerID, inv.billTo) as ownerID,
      SUM(COALESCE(el.payment, 0)) as total
    FROM
      ${dbPrefix}_expenses.eLedger el
      LEFT JOIN ${dbPrefix}_expenses.recurring r on r.recurringID = el.recurringID
      LEFT JOIN ${dbPrefix}_expenses.vendor v on v.vendorID = COALESCE(el.vendorID, r.vendorID)
      LEFT JOIN ${dbPrefix}_assets.unit u on u.unitID = el.unitID
      LEFT JOIN ${dbPrefix}_assets.location loc on loc.locationID = COALESCE(el.locationID, el.unitID)
      LEFT JOIN ${dbPrefix}_income.invoices inv on inv.invoiceID = el.invoiceID
    WHERE
      el.dateStamp IS NOT NULL
      AND el.dateStamp <= '${reportDate}' AND el.dateStamp >= DATE('${reportDate}' - INTERVAL 1 YEAR)
      AND COALESCE(el.expenseID, r.expenseID, v.expenseID, inv.expenseID) in (${inExpenseIDs})
      AND COALESCE(el.ownerID, r.ownerID, loc.ownerID, inv.billTo) in (${inOwnerIDs})
    GROUP BY
      COALESCE(el.ownerID, r.ownerID, loc.ownerID, inv.billTo)`

  return sql;
}





function expenseIDsFor(category) {
  return expenseTypes.filter(et => et.category === category).map(et => et.expenseID)
}

const expenseTypes = [
  {expenseID: 1,	type: "Utilities: Gas & Electric",	category: 'utilities'},
  {expenseID: 2,	type: "Utilities: Gas",	category: 'utilities'},
  {expenseID: 3,	type: "Utilities: Electric",	category: 'utilities'},
  {expenseID: 4,	type: "Utilities: Water/Sewer",	category: 'utilities'},
  {expenseID: 5,	type: "Utilities: Cable",	category: 'utilities'},
  {expenseID: 6,	type: "Utilities: Phone",	category: 'utilities'},
  {expenseID: 7,	type: "Insurance",	category: 'operations'},
  {expenseID: 8,	type: "Contracted Services",	category: 'maintenance'},
  {expenseID: 9,	type: "Materials & Supplies",	category: 'maintenance'},
  {expenseID: 10,	type: "Mortgage",	category: 'capital'},
  {expenseID: 11,	type: "Taxes",	category: 'operations'},
  {expenseID: 12,	type: "Court Fees",	category: 'operations'},
  {expenseID: 13,	type: "Bank/Credit Fees & Interest",	category: 'operations'},
  {expenseID: 14,	type: "Secured Credit- Principal",	category: 'capital'},
  {expenseID: 15,	type: "Unsecured Credit",	category: 'capital'},
  {expenseID: 16,	type: "Vehicle & Fuel",	category: 'operations'},
  {expenseID: 17,	type: "Office",	category: 'operations'},
  {expenseID: 18,	type: "Travel",	category: 'operations'},
  {expenseID: 19,	type: "Meals",	category: 'operations'},
  {expenseID: 20,	type: "Advertising",	category: 'operations'},
  {expenseID: 21,	type: "Accounting",	category: 'operations'},
  {expenseID: 22,	type: "Legal",	category: 'operations'},
  {expenseID: 23,	type: "Maintenance & Repairs",	category: 'maintenance'},
  {expenseID: 24,	type: "Professional Services",	category: 'operations'},
  {expenseID: 25,	type: "Management Fees",	category: 'operations'},
  {expenseID: 26,	type: "Administrative",	category: 'operations'},
  {expenseID: 27,	type: "Payroll",	category: 'operations'},
  {expenseID: 28,	type: "Turnover",	category: 'maintenance'},
  {expenseID: 29,	type: "Grounds Keeping",	category: 'maintenance'},
  {expenseID: 30,	type: "Security",	category: 'utilities'},
  {expenseID: 31,	type: "Utilities: Internet",	category: 'utilities'},
  {expenseID: 32,	type: "Utilities: Phone & Internet",	category: 'utilities'},
  {expenseID: 33,	type: "Utilities: Cable & Internet",	category: 'utilities'},
  {expenseID: 34,	type: "Utilities: Cable, Phone & Internet",	category: 'utilities'},
  {expenseID: 35,	type: "Commission & Bonuses",	category: 'operations'},
  {expenseID: 36,	type: "Carpet Cleaning & Repair",	category: 'maintenance'},
  {expenseID: 37,	type: "Waste Removal",	category: 'maintenance'},
  {expenseID: 38,	type: "Pest Control",	category: 'operations'},
  {expenseID: 39,	type: "Water/Flood Damage",	category: 'maintenance'},
  {expenseID: 40,	type: "Moving",	category: 'operations'},
  {expenseID: 41,	type: "Capital Improvement: Flooring",	category: 'capital'},
  {expenseID: 42,	type: "Background & Credit Checks",	category: 'operations'},
  {expenseID: 43,	type: "Postage",	category: 'operations'},
  {expenseID: 44,	type: "Capital Improvement: HVAC",	category: 'capital'},
  {expenseID: 45,	type: "HVAC Repair",	category: 'maintenance'},
  {expenseID: 46,	type: "Capital Improvement: Roof",	category: 'capital'},
  {expenseID: 47,	type: "Roof Repair",	category: 'maintenance'},
  {expenseID: 48,	type: "Training",	category: 'operations'},
  {expenseID: 49,	type: "Pool Maintenance",	category: 'maintenance'},
  {expenseID: 50,	type: "Appliance Repair",	category: 'maintenance'},
  {expenseID: 51,	type: "Licensing & Permits",	category: 'operations'},
  {expenseID: 52,	type: "Custodial",	category: 'maintenance'},
  {expenseID: 53,	type: "Tenant Retention",	category: 'operations'},
  {expenseID: 54,	type: "Marketing",	category: 'operations'},
  {expenseID: 55,	type: "Dues & Subscriptions",	category: 'operations'},
  {expenseID: 56,	type: "Computer & IT Services",	category: 'operations'},
  {expenseID: 57,	type: "Tenant Reimbursement (Misc)",	category: 'operations'},
  {expenseID: 58,	type: "Utilities (General)",	category: 'utilities'},
  {expenseID: 59,	type: "Mortgage Interest",	category: 'capital'},
  {expenseID: 60,	type: "Rent Refund",	category: 'operations'},
  {expenseID: 61,	type: "Account Transfer- Garage",	category: 'operations'},
  {expenseID: 63,	type: "Capital Improvement: Plumbing",	category: 'capital'},
  {expenseID: 64,	type: "Capital Improvement: Rent Ready",	category: 'capital'},
  {expenseID: 65,	type: "Capital Improvement: Building",	category: 'capital'},
  {expenseID: 66,	type: "Capital Improvement: Electrical",	category: 'capital'},
  {expenseID: 67,	type: "Capital Improvement: Landscaping",	category: 'capital'},
  {expenseID: 68,	type: "Capital Improvement: Painting",	category: 'capital'},
  {expenseID: 69,	type: "Capital Improvement: Appliance",	category: 'capital'},
  {expenseID: 70,	type: "Capital Improvement: Vinyl",	category: 'capital'},
  {expenseID: 72,	type: "Tenant Reimbursement: Utilities",	category: 'operations'},
  {expenseID: 73,	type: "Charitable Contributions",	category: 'operations'},
  {expenseID: 94,	type: "Capital Reserve",	category: 'capital'},
  {expenseID: 95,	type: "Security Deposit Refund",	category: 'operations'},
  {expenseID: 96,	type: "Account Transfer",	category: 'capital'},
  {expenseID: 97,	type: "Capital Improvement (Misc Depreciable)",	category: 'capital'},
  {expenseID: 98,	type: "Capital Disbursement",	category: 'capital'},
  {expenseID: 99,	type: "Miscellaneous",	category: 'operations'},
  {expenseID: 74,	type: "Secured Credit- Interest",	category: 'capital'},
  {expenseID: 75,	type: "Plumbing Repair",	category: 'maintenance'},
  {expenseID: 76,	type: "Printer/Copier Expense",	category: 'operations'},
  {expenseID: 127,	type: "Capital Improvement: Cabinets",	category: 'capital'},
  {expenseID: 128,	type: "Capital Improvement: Water Leaks",	category: 'capital'},
  {expenseID: 129,	type: "Capital Improvement: Fire Restoration",	category: 'capital'},
  {expenseID: 77,	type: "Utilities: Water/Sewer & Electric",	category: 'utilities'},
  {expenseID: 78,	type: "Sewer",	category: 'utilities'},
  {expenseID: 130,	type: "Mortgage Principal+Escrow",	category: 'capital'},
  {expenseID: 131,	type: "Mortgage Principal+Interest+Escrow",	category: 'capital'},
  {expenseID: 132,	type: "Mortgage Escrow",	category: 'capital'},
  {expenseID: 133,	type: "Mortgage Principal+Interest",	category: 'capital'},
  {expenseID: 134,	type: "Closing and Refinancing Costs",	category: 'capital'},
  {expenseID: 135,	type: "Good Faith Deposit",	category: 'capital'},
  {expenseID: 136,	type: "Fixed Asset: Building Purchase",	category: 'capital'},
  {expenseID: 137,	type: "Capital Improvement: Carpet",	category: 'capital'},
  {expenseID: 138,	type: "Capital Improvement: Windows",	category: 'capital'},
  {expenseID: 139,	type: "Loan to 3rd Party",	category: 'capital'},
  {expenseID: 140,	type: "Unsecured Credit- Interest",	category: 'capital'},
  {expenseID: 141,	type: "Other Loan Payment",	category: 'capital'},
];

import * as db from '../../../db';


export default function pl(options) {
  const dbPrefix = db.getPrefix();
  const filters = options.filter || {};
  const missing = ['startDate', 'endDate', 'ownerID'].filter(f => !filters.hasOwnProperty(f));
  if (missing.length) {
    throw new Error(`ProfitLoss dataservice missing filters: [${missing.join(',')}]`);
  }
  const {startDate, endDate, ownerID} = filters;

  const incomeQuery = `
  SELECT
    inc.type as accountName,
    mgl.acctGL as accountCode,
    'income' as accountType,
    mgl.type as accountGroup,
    SUM(il.amount) as accountBalance
  FROM ${dbPrefix}_income.iLedger il
    LEFT JOIN ${dbPrefix}_income.income inc on il.incomeID = inc.incomeID
    LEFT JOIN ${dbPrefix}_log.mapGL mgl on mgl.mapID = inc.mapID
    LEFT JOIN ${dbPrefix}_assets.lease lse on lse.leaseID = il.leaseID
    LEFT JOIN ${dbPrefix}_assets.unit u on u.unitID = lse.unitID
    LEFT JOIN ${dbPrefix}_assets.location loc on loc.locationID = u.locationID
    LEFT JOIN ${dbPrefix}_assets.deed d on d.locationID = loc.locationID
      and il.dateStamp BETWEEN d.startDate AND COALESCE(d.endDate, '${endDate}')
      and d.ownerID = COALESCE(il.accountID, loc.ownerID)
  WHERE
    COALESCE(il.accountID, loc.ownerID) = '${ownerID}'
    AND il.dateStamp BETWEEN '${startDate}' AND '${endDate}'
    AND (loc.locationID is NULL OR il.dateStamp >=d.startDate)
    AND il.incomeID IS NOT NULL
  GROUP BY
    inc.type, mgl.acctGL, mgl.type`;

const expenseQuery = `
  SELECT
    exp.type as accountName,
    mgl.acctGL as accountCode,
    'expense' as accountType,
    mgl.type as accountGroup,
    SUM(el.payment) as accountBalance
  FROM ${dbPrefix}_expenses.eLedger el
    LEFT JOIN ${dbPrefix}_expenses.recurring r ON el.recurringID = r.recurringID
    LEFT JOIN ${dbPrefix}_assets.location loc ON loc.locationID=COALESCE(el.locationID,r.locationID)
    LEFT JOIN ${dbPrefix}_expenses.vendor v on v.vendorID=COALESCE(el.vendorID, r.vendorID)
    LEFT JOIN ${dbPrefix}_assets.deed d on d.locationID = loc.locationID
      and el.dateStamp BETWEEN d.startDate AND COALESCE(d.endDate, '${endDate}')
      and d.ownerID = COALESCE(el.ownerID, r.ownerID)
    LEFT JOIN ${dbPrefix}_expenses.expense exp on COALESCE(el.expenseID, r.expenseID, v.expenseID) = exp.expenseID
    LEFT JOIN ${dbPrefix}_log.mapGL mgl on mgl.mapID = exp.mapID
  WHERE
    COALESCE(d.ownerID, el.ownerID, r.ownerID) = '${ownerID}'
    AND (
      (el.dateStamp BETWEEN '${startDate}' AND '${endDate}')
      AND (loc.locationID IS NULL OR el.dateStamp >= d.startDate)
      OR (el.dateStamp IS NULL AND el.createDate BETWEEN '${startDate}' AND '${endDate}')
    )
  GROUP BY
    exp.type, mgl.acctGL, mgl.type`;

const fullQuery = `SELECT *
  FROM (
    (${incomeQuery})
    UNION ALL
    (${expenseQuery})
  ) as entries
  ORDER BY
    accountType, accountGroup, accountCode`;

  return db.query(fullQuery);
}

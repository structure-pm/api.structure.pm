import * as db from '../../../db';
import * as dateUtils from './dateUtils';
import Moment from 'moment';




export function partitionBy(options, prefix, sumColumn) {
  const {partition} = options;
  const columnSQL = [];
  const partitions = [];

  const columnNameDateFormats = {
    month: 'MMM-YYYY',
    quarter: '[Q]Q-YYYY',
    year: 'YYYY'
  };

  // Partition by time period
  if (['month', 'year', 'quarter'].indexOf(partition) >=0) {
    const {startDate, endDate} = options.filter;
    const periods = dateUtils.nBetween(partition, startDate, endDate);
    periods
      .map(period => Moment(period))
      .forEach((period, idx) => {
        const start = period.startOf(partition).format('YYYY-MM-DD'); //toISOString();
        const end = period.endOf(partition).format('YYYY-MM-DD'); //toISOString();
        const field = `partition${idx}`;
        const name = period.format(columnNameDateFormats[partition]);
        const col = `SUM(CASE WHEN ${prefix}.dateStamp BETWEEN '${start}' AND '${end}' THEN ${prefix}.${sumColumn} ELSE 0 END) AS ${field}`;
        columnSQL.push(col);
        partitions.push({field, name} );
      })
  }

  // Default partition is the account balance
  columnSQL.push(`SUM(${prefix}.${sumColumn}) as accountBalance`);
  partitions.push({field: 'accountBalance', name: 'Balance'});

  return { columnSQL: columnSQL.join(',\n'), partitions }
}


export default function pl(options) {
  const dbPrefix = db.getPrefix();
  const filters = options.filter || {};
  const missing = ['startDate', 'endDate', 'ownerID'].filter(f => !filters.hasOwnProperty(f));
  if (missing.length) {
    throw new Error(`ProfitLoss dataservice missing filters: [${missing.join(',')}]`);
  }
  const {startDate, endDate, ownerID} = filters;
  let {columnSQL, partitions} = partitionBy(options, 'il', 'amount');
  const incomeQuery = `
  SELECT
    inc.type as accountName,
    CASE
      WHEN inc.type REGEXP 'capital|mortgage' THEN 'Capital Income/Expense'
      ELSE 'Operating Income/Expense'
    END as accountOperating,
    mgl.acctGL as accountCode,
    'income' as accountType,
    mgl.type as accountGroup,
    ${columnSQL}
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
    and mgl.sIncome = 1
  GROUP BY
    inc.type, mgl.acctGL, mgl.type`;

  const elPartition = partitionBy(options, 'el', 'payment');
  columnSQL = elPartition.columnSQL;

  const expenseQuery = `
  SELECT
    exp.type as accountName,
    CASE
      WHEN exp.type REGEXP 'capital|mortgage' THEN 'Capital Income/Expense'
      ELSE 'Operating Income/Expense'
    END as accountOperating,
    mgl.acctGL as accountCode,
    'expense' as accountType,
    mgl.type as accountGroup,
    ${columnSQL}
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
    and mgl.sIncome = 1
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

  return db.query(fullQuery)
    .then(data => ({
      data,
      count: data.length,
      partitions
    }));
}


function partitionData(data, partitions) {
  return data.map()
}

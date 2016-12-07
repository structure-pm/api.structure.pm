import * as db from '../../../db';
import * as dateUtils from './dateUtils';
import Moment from 'moment';
import Promise from 'bluebird';




export function partitionBy(options, prefix, sumColumn) {
  const {partition} = options;
  const columnSQL = [];
  const partitions = [];

  const columnNameDateFormats = {
    month: 'MMM-YYYY',
    quarter: '[Q]Q-YYYY',
    year: 'YYYY'
  };

  return Promise.resolve([partitions, columnSQL])
    .spread((partitions, columnSQL) => {
      // Partition by time period
      if (['month', 'year', 'quarter'].indexOf(partition) >=0) {
        const {dateRange} = options;
        const {startDate, endDate} = dateRange;
        const periods = dateUtils.nBetween(partition, startDate, endDate);
        periods
        .map(period => Moment(period))
        .forEach((period, idx) => {
          const start = period.startOf(partition).format('YYYY-MM-DD'); //toISOString();
          const end = period.endOf(partition).format('YYYY-MM-DD'); //toISOString();
          const field = `partition_period_${idx}`;
          const name = period.format(columnNameDateFormats[partition]);
          const col = `SUM(CASE WHEN ${prefix}.dateStamp BETWEEN '${start}' AND '${end}' THEN ${prefix}.${sumColumn} ELSE 0 END) AS ${field}`;
          columnSQL.push(col);
          partitions.push({field, name} );
        })
      }
      return [partitions, columnSQL];
    })
    .spread((partitions, columnSQL) => {
      if (partition === 'location') {
        const dbPrefix = db.getPrefix();
        const {ownerID} = options.filter;
        const locationQuery = `SELECT
            locationID,
            COALESCE(shortHand, CONCAT_WS(' ', streetNum, street), locationID) as name
          FROM ${dbPrefix}_assets.location
          WHERE ownerID='${ownerID}'`;
        return db.query(locationQuery).then(locations => {
          // Entries not associated with a specific location
          const name = "General";
          const field = "partition_location_general";
          columnSQL.push(`SUM(CASE WHEN loc.locationID IS NULL THEN ${prefix}.${sumColumn} ELSE 0 END) AS ${field}`)
          partitions.push({field, name})

          // Entries associated with a location
          locations.forEach((loc, idx) => {
            const field = `partition_location_${idx}`;
            const name = loc.name;
            const col = `SUM(CASE WHEN loc.locationID = '${loc.locationID}' THEN ${prefix}.${sumColumn} ELSE 0 END) AS ${field}`;
            columnSQL.push(col);
            partitions.push({field, name});
          });

          return [partitions, columnSQL];
        })
      } else {
        return [partitions, columnSQL];
      }
    })
    .spread((partitions, columnSQL) => {
      // Default partition is the account balance
      const defaultName = (partitions.length) ? 'Total' : 'Balance'
      columnSQL.push(`SUM(${prefix}.${sumColumn}) as accountBalance`);
      partitions.push({field: 'accountBalance', name: defaultName});

      return { columnSQL: columnSQL.join(',\n'), partitions }
    })


}


export default function pl(options) {
  const dbPrefix = db.getPrefix();
  const missing = ['dateRange', 'ownerID'].filter(f => !options.hasOwnProperty(f));
  if (missing.length) {
    throw new Error(`ProfitLoss dataservice missing parameters: [${missing.join(',')}]`);
  }
  const {dateRange, ownerID} = options;
  const {startDate, endDate} = dateRange;
  let partitions

  return Promise.all([
    partitionBy(options, 'il', 'amount'),
    partitionBy(options, 'el', 'payment'),
  ])
    .spread((incomePartition, expensePartition) => {
      const incomeQuery = `
      SELECT
        inc.type as accountName,
        CASE
          WHEN
            inc.type REGEXP 'capital|mortgage' AND not inc.type REGEXP 'mortgage interest'
          THEN 'Capital Income/Expense'
          ELSE 'Operating Income/Expense'
        END as accountOperating,
        mgl.acctGL as accountCode,
        'income' as accountType,
        mgl.type as accountGroup,
        'credit' as normalBalance,
        ${incomePartition.columnSQL}
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
        AND il.incomeID IS NOT NULL and il.feeAdded != 1
        and mgl.sIncome = 1
      GROUP BY
        inc.type, mgl.acctGL, mgl.type`;

      const expenseQuery = `
      SELECT
        exp.type as accountName,
        CASE
          WHEN exp.type REGEXP 'capital|mortgage|Fixed Asset' AND not exp.type REGEXP 'mortgage interest'
          THEN 'Capital Income/Expense'
          ELSE 'Operating Income/Expense'
          END as accountOperating,
        mgl.acctGL as accountCode,
        CASE WHEN mgl.type REGEXP 'Income' THEN 'income' ELSE 'expense' END as accountType,
        CASE
          WHEN exp.type = 'Mortgage Interest' THEN 'Indirect Expense'
          WHEN exp.type REGEXP 'mortgage' THEN 'Debt Service'
          ELSE mgl.type
          END as accountGroup,
        'debit' as normalBalance,
        ${expensePartition.columnSQL}
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
        accountCode`;

      return db.query(fullQuery)
        .then(data => ({
          data,
          count: data.length,
          partitions: incomePartition.partitions
        }))
    })


}

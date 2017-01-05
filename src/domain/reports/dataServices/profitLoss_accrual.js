import * as db from '../../../db';
import * as dateUtils from './dateUtils';
import Moment from 'moment';
import Promise from 'bluebird';



export function partitionForAccruedRentBy(options, prefix) {
  const {partition} = options;
  const columnSQL = [];
  const partitions = [];

  const columnNameDateFormats = {
    month: 'MMM-YYYY',
    quarter: '[Q]Q-YYYY',
    year: 'YYYY'
  };

}


export function partitionBy(options, queryTypeSelector) {
  const dbPrefix = db.getPrefix();
  const {partition} = options;
  const columnSQL = [];
  const partitions = [];

  const queryType = {
    income: {
      prefix: 'il',
      sumColumn: 'amount',
      defaultColSQL: data => `SUM(${data.prefix}.${data.sumColumn}) as ${data.field}`,
      timeColSQL: data => `SUM(CASE WHEN ${data.prefix}.dateStamp >= '${data.start}' AND ${data.prefix}.dateStamp <= '${data.end}' THEN ${data.prefix}.${data.sumColumn} ELSE 0 END) AS ${data.field}`,
      locColSQL: data => `SUM(CASE WHEN ${data.locSelector} THEN ${data.prefix}.${data.sumColumn} ELSE 0 END) AS ${data.field}`
    },
    expense: {
      prefix: 'el',
      sumColumn: 'amount',
      defaultColSQL: data => `SUM(${data.prefix}.${data.sumColumn}) as ${data.field}`,
      timeColSQL: data => `SUM(CASE WHEN el.dueDate >= '${data.start}' AND el.dueDate <= '${data.end}' THEN ${data.prefix}.${data.sumColumn} ELSE 0 END) AS ${data.field}`,
      locColSQL: data => `SUM(CASE WHEN ${data.locSelector} THEN ${data.prefix}.${data.sumColumn} ELSE 0 END) AS ${data.field}`
    },
    accruedRent: {
      prefix: 'lse',
      defaultColSQL: data => `SUM(
        ${dbPrefix}_assets.month_diff(
          GREATEST(${data.prefix}.startDate, '${data.start}'),
          LAST_DAY(LEAST(${data.prefix}.endDate, '${data.end}')) ) * ${data.prefix}.rent
        )  AS ${data.field}`,
      timeColSQL: data => `SUM(CASE
        WHEN ${data.prefix}.startDate < '${data.end}' AND ${data.prefix}.endDate > '${data.start}'
        THEN ${dbPrefix}_assets.month_diff(
          GREATEST(${data.prefix}.startDate, '${data.start}'),
          LAST_DAY(LEAST(${data.prefix}.endDate, '${data.end}')) ) * ${data.prefix}.rent
        ELSE 0
        END) ${data.field}`,
      locColSQL: data => `SUM(CASE
        WHEN ${data.locSelector}
        THEN ${dbPrefix}_assets.month_diff(
          GREATEST(${data.prefix}.startDate, '${data.start}'),
          LAST_DAY(LEAST(${data.prefix}.endDate, '${data.end}')) ) * ${data.prefix}.rent
        ELSE 0
        END)  AS ${data.field}`
    }
  }[queryTypeSelector];

  if (!queryType) return Promise.reject(new Error(`Unknown queryType '${queryTypeSelector}'`));


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

        periods.map(period => Moment(period))
          .forEach((period, idx) => {
            const start = period.startOf(partition).format('YYYY-MM-DD'), //toISOString();
                  end = period.endOf(partition).format('YYYY-MM-DD'), //toISOString();
                  field = `partition_period_${idx}`,
                  name = period.format(columnNameDateFormats[partition]);

            const partitionOptions = Object.assign({start, end, field, name}, queryType);
            const col = queryType.timeColSQL(partitionOptions);

            columnSQL.push(col);
            partitions.push({field, name} );
          })
      }
      return [partitions, columnSQL];
    })
    .spread((partitions, columnSQL) => {
      if (partition === 'location') {
        const dbPrefix = db.getPrefix();
        const {ownerID, startDate, endDate} = options;
        const locationQuery = `SELECT
            locationID,
            COALESCE(shortHand, CONCAT_WS(' ', streetNum, street), locationID) as name
          FROM ${dbPrefix}_assets.location
          WHERE ownerID='${ownerID}'`;
        return db.query(locationQuery).then(locations => {

          // Entries not associated with a specific location
          const name = "General",
                field = "partition_location_general",
                start = startDate,
                end = endDate,
                locSelector = 'loc.locationID IS NULL'

          const partitionOptions = Object.assign({field, name, locSelector, start, end}, queryType);
          const col = queryType.locColSQL(partitionOptions);

          columnSQL.push(col)
          partitions.push({field, name})

          // Entries associated with a location
          locations.forEach((loc, idx) => {
            const field = `partition_location_${idx}`,
                  name = loc.name,
                  start = startDate,
                  end = endDate,
                  locSelector = `loc.locationID = '${loc.locationID}'`;

            const partitionOptions = Object.assign({field, name, locSelector, start, end}, queryType);
            const col = queryType.locColSQL(partitionOptions);

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
      const name = (partitions.length) ? 'Total' : 'Balance',
            field = 'accountBalance',
            start = options.startDate,
            end = options.endDate;

      const partitionOptions = Object.assign({field, name, start, end}, queryType);
      const col = queryType.defaultColSQL(partitionOptions);

      columnSQL.push(col);
      partitions.push({field, name});

      return { columnSQL: columnSQL.join(',\n'), partitions }
    })


}

// TODO: Break that monster function above into smaller ones
export function buildTimePartition() {

}
export function buildLocationPartition() {

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
    partitionBy(options, 'income'),
    partitionBy(options, 'expense'),
    partitionBy(options, 'accruedRent'),
  ])
    .spread((incomePartition, expensePartition, accruedRentPartition) => {
      const accruedRentQuery =  `SELECT
        (SELECT type FROM ${dbPrefix}_income.income where incomeID=1) as accountName,
        'Operating Income/Expense' as accountOperating,
        (SELECT mgl.acctGL
          FROM ${dbPrefix}_log.mapGL mgl
          JOIN ${dbPrefix}_income.income inc on mgl.mapID = inc.mapID
          WHERE inc.incomeID = 1) as accountCode,
        'income' as accountType,
        (SELECT mgl.type
          FROM ${dbPrefix}_log.mapGL mgl
          JOIN ${dbPrefix}_income.income inc on mgl.mapID = inc.mapID
          WHERE inc.incomeID = 1) as accountGroup,
        'credit' as normalBalance,
        ${accruedRentPartition.columnSQL}
      FROM
        ${dbPrefix}_assets.lease lse
        JOIN ${dbPrefix}_assets.unit u on u.unitID = lse.unitID
        JOIN ${dbPrefix}_assets.location loc on loc.locationID = u.locationID
      WHERE
        loc.ownerID = '${ownerID}'
        AND (lse.endDate > '${startDate}' OR lse.endDate IS NULL)
        AND lse.startDate < '${endDate}'`;

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
        LEFT JOIN ${dbPrefix}_income.invoices inv on inv.invoiceID = il.invoiceID
        LEFT JOIN ${dbPrefix}_assets.deed d on d.locationID = loc.locationID
          and COALESCE(inv.dueDate, inv.invDate, il.dateStamp) BETWEEN d.startDate AND COALESCE(d.endDate, '${endDate}')
          and d.ownerID = COALESCE(il.accountID, loc.ownerID)
      WHERE
        COALESCE(il.accountID, loc.ownerID) = '${ownerID}'
        AND COALESCE(inv.dueDate, inv.invDate, il.dateStamp) BETWEEN '${startDate}' AND '${endDate}'
        AND (loc.locationID is NULL OR COALESCE(inv.dueDate, inv.invDate, il.dateStamp) >=d.startDate)
        AND il.incomeID IS NOT NULL and il.feeAdded != 1
        AND il.incomeID !=1 -- no rent payments
        and mgl.sIncome = 1
      GROUP BY
        inc.type, mgl.acctGL, mgl.type`;


      const expenseQuery = `
      SELECT
        exp.type as accountName,
        CASE
          WHEN exp.type REGEXP 'capital|mortgage' AND not exp.type REGEXP 'mortgage interest'
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
          and el.dueDate BETWEEN d.startDate AND COALESCE(d.endDate, '${endDate}')
          and d.ownerID = COALESCE(el.ownerID, r.ownerID)
        LEFT JOIN ${dbPrefix}_expenses.expense exp on COALESCE(el.expenseID, r.expenseID, v.expenseID) = exp.expenseID
        LEFT JOIN ${dbPrefix}_log.mapGL mgl on mgl.mapID = exp.mapID
      WHERE
        COALESCE(d.ownerID, el.ownerID, r.ownerID) = '${ownerID}'
        AND (
          (el.dueDate BETWEEN '${startDate}' AND '${endDate}')
          AND (loc.locationID IS NULL OR el.dueDate >= d.startDate)
          OR (el.dueDate IS NULL AND el.createDate BETWEEN '${startDate}' AND '${endDate}')
        )
        and mgl.sIncome = 1
      GROUP BY
        exp.type, mgl.acctGL, mgl.type`;

      const fullQuery = `SELECT *
      FROM (
        (${incomeQuery})
        UNION ALL
        (${accruedRentQuery})
        UNION ALL
        (${expenseQuery})
      ) as entries
      ORDER BY
        accountType, accountGroup, accountCode`;

      return db.query(fullQuery)
        .then(data => ({
          data,
          count: data.length,
          partitions: incomePartition.partitions
        }))
    })


}

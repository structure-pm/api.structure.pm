import Moment from 'moment';
import * as db from '../../../db';



export default function gl(options) {
  const {dateRange, managerID} = options;
  const start = Moment(dateRange.startDate).format('YYYY-MM-DD');
  const end = Moment(dateRange.endDate).format('YYYY-MM-DD');

  if (!managerID || !dateRange.startDate || !dateRange.endDate) {
    throw new Error(`Missing required fields for Global Ledger dataset`);
  }

  const dbPrefix = db.getPrefix();

  const sql = `
    SELECT SQL_NO_CACHE *
    FROM (
      -- Income
      SELECT
        il.entryID,
        COALESCE(d.ownerID, il.accountID) as ownerID,
        loc.locationID,
        loc.shorthand as locationName,
        COALESCE(u.suiteNum, u.streetNum) as unitNumber,
        il.dateStamp as entryDate,
        il.amount as income,
        NULL as expense,
        il.reconciled as isReconciled,
        CONCAT_WS(' ', ten.firstName, ten.lastName) as payeeVendorName,
        il.incomeID as incomeID,
        NULL as expenseID,
        inc.type as glAccountName,
        lse.leaseID,
        il.comment,
        NULL as method
      FROM ${dbPrefix}_income.iLedger il
        LEFT JOIN ${dbPrefix}_income.income inc on inc.incomeID = il.incomeID
        LEFT JOIN ${dbPrefix}_assets.lease lse on lse.leaseID = il.leaseID
        LEFT JOIN ${dbPrefix}_assets.tenant ten on ten.tenantID = lse.tenantID
        LEFT JOIN ${dbPrefix}_assets.unit u on u.unitID = lse.unitID
        LEFT JOIN ${dbPrefix}_assets.location loc on loc.locationID = u.locationID
        LEFT JOIN ${dbPrefix}_assets.deed d on d.locationID = loc.locationID
          AND il.dateStamp >= d.startDate
          AND il.dateStamp <= COALESCE(d.endDate, '${end}')
        LEFT JOIN ${dbPrefix}_assets.owner own on own.ownerID = loc.ownerID
      WHERE
        il.dateStamp >= '${start}' AND il.dateStamp <= '${end}'
        AND (loc.locationID is NULL OR il.dateStamp >=d.startDate)
        AND own.managedBy = '${managerID}'

      UNION ALL
      -- expenses
      SELECT
        el.entryID,
        COALESCE(d.ownerID, el.ownerID, r.ownerID) as ownerID,
        loc.locationID,
        loc.shorthand as locationName,
        COALESCE(u.suiteNum, u.streetNum) as unitNumber,
        COALESCE(el.dateStamp, el.dueDate, el.createDate) as entryDate,
        NULL as income,
        el.amount as expense,
        el.reconciled as isReconciled,
        COALESCE(c.cName, CONCAT_WS(' ', c.fName, c.lName), c.lName) as payeeVendorName,
        NULL as incomeID,
        COALESCE(el.expenseID, r.expenseID, v.expenseID) as expenseID,
        ex.type as glAccountName,
        NULL as leaseID,
        el.comment,
        COALESCE(el.checkID, el.payMethod) as method
      FROM
        ${dbPrefix}_expenses.eLedger el
        LEFT JOIN ${dbPrefix}_assets.unit u on u.unitID = el.unitID
        LEFT JOIN ${dbPrefix}_expenses.recurring r ON el.recurringID = r.recurringID
        LEFT JOIN ${dbPrefix}_assets.location loc ON loc.locationID=COALESCE(el.locationID,r.locationID, u.unitID)
        LEFT JOIN ${dbPrefix}_expenses.vendor v on v.vendorID=COALESCE(el.vendorID, r.vendorID)
        LEFT JOIN ${dbPrefix}_assets.contacts c on c.contactID = v.contactID
        LEFT JOIN ${dbPrefix}_expenses.expense ex on ex.expenseID = COALESCE(el.expenseID, r.expenseID, v.expenseID)
        LEFT JOIN ${dbPrefix}_assets.deed d on d.locationID = loc.locationID
          AND COALESCE(el.dateStamp, el.createDate) >= d.startDate
          AND COALESCE(el.dateStamp, el.createDate) <= COALESCE(d.endDate, '${end}')
        LEFT JOIN ${dbPrefix}_assets.owner own on own.ownerID = loc.ownerID

      WHERE
        -- el.dateStamp IS NULL means that the bill is still pending
        (COALESCE(el.createDate, el.dueDate) >= '${start}' AND COALESCE(el.createDate, el.dueDate) <= '${end}')
        AND (loc.locationID IS NULL OR (COALESCE(el.dateStamp, el.createDate) >= d.startDate))
        AND own.managedBy='${managerID}'
    ) entries
    ORDER BY entryDate DESC`;

  return db.query(sql)
    .then(data => ({
      data,
      count: data.length,
    }))

}

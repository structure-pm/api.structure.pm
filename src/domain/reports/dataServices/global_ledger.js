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
        own.ownerID as ownerID,
        COALESCE(own.nickname, own.lName, own.ownerID) as ownerName,
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
        mgl.name as glAccountName,
        lse.leaseID,
        il.comment,
        NULL as method
      FROM ${dbPrefix}_income.iLedger il
        LEFT JOIN ${dbPrefix}_income.income inc on inc.incomeID = il.incomeID
        LEFT JOIN ${dbPrefix}_log.mapGL mgl on mgl.mapID = inc.mapID
        LEFT JOIN ${dbPrefix}_assets.lease lse on lse.leaseID = il.leaseID
        LEFT JOIN ${dbPrefix}_assets.tenant ten on ten.tenantID = lse.tenantID
        LEFT JOIN ${dbPrefix}_assets.unit u on u.unitID = lse.unitID
        LEFT JOIN ${dbPrefix}_assets.location loc on loc.locationID = u.locationID
        LEFT JOIN ${dbPrefix}_assets.deed d on d.locationID = loc.locationID
          AND il.dateStamp >= d.startDate
          AND il.dateStamp <= COALESCE(d.endDate, '${end}')
        LEFT JOIN ${dbPrefix}_assets.owner own on own.ownerID = COALESCE(loc.ownerID, il.accountID)
      WHERE
        il.feeAdded <> 1 AND il.adjustment <> 1
        AND il.dateStamp >= '${start}' AND il.dateStamp <= '${end}'
        AND (loc.locationID is NULL OR il.dateStamp >=d.startDate)
        AND own.managedBy = '${managerID}'

      UNION ALL
      -- expenses
      SELECT
        el.entryID,
        own.ownerID as ownerID,
        COALESCE(own.nickname, own.lName, own.ownerID) as ownerName,
        loc.locationID,
        loc.shorthand as locationName,
        COALESCE(u.suiteNum, u.streetNum) as unitNumber,
        el.dateStamp as entryDate,
        NULL as income,
        el.amount as expense,
        el.reconciled as isReconciled,
        CASE WHEN (v.vendorID = 1)
          THEN mgr.name
          ELSE COALESCE(c.cName, CONCAT_WS(' ', c.fName, c.lName), c.lName) END as payeeVendorName,
        NULL as incomeID,
        COALESCE(el.expenseID, r.expenseID, v.expenseID) as expenseID,
        mgl.name as glAccountName,
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
        LEFT JOIN ${dbPrefix}_log.mapGL mgl on mgl.mapID = ex.mapID
        LEFT JOIN ${dbPrefix}_assets.deed d on d.locationID = loc.locationID
          AND COALESCE(el.dateStamp, el.createDate) >= d.startDate
          AND COALESCE(el.dateStamp, el.createDate) <= COALESCE(d.endDate, '${end}')
        LEFT JOIN ${dbPrefix}_assets.owner own on own.ownerID = loc.ownerID
        LEFT JOIN ${dbPrefix}_assets.manager mgr ON mgr.managerID = own.managedBy

      WHERE
        -- el.dateStamp IS NULL means that the bill is still pending
        el.dateStamp IS NOT NULL
        AND (el.dateStamp >= '${start}' AND el.dateStamp <= '${end}')
        AND (loc.locationID IS NULL OR (el.dateStamp >= d.startDate))
        AND own.managedBy='${managerID}'
    ) entries
    ORDER BY entryDate DESC`;

  return db.query(sql)
    .then(data => ({
      data,
      count: data.length,
    }))

}

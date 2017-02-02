// import Moment from 'moment';
import * as db from '../../../db';

export default function assetManagerReport(options) {
  const {reportDate, ownerIDs} = options;

  return Promise.all([
    db.query(unitStatesByOwner(options)),
    db.query(rentByOwner(options)),
    db.query(leaseAddonsByOwner(options)),
    db.query(adjAndFeesByOwner(options)),
  ]).then((collections) => {
    const table = joinOnProp('ownerID', collections);
    return {
      data: table,
      count: table.length
    }
  });


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
      d.ownerID
  ) as unitStats on unitStats.ownerID = own.ownerID`

  return sql;
}


function rentByOwner({reportDate, ownerIDs}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const sql = `SELECT
      d.ownerID,
      SUM(lse.rent) as total
    FROM
      ${dbPrefix}_assets.lease lse
      JOIN ${dbPrefix}_assets.unit u on u.unitID = lse.unitID
      JOIN ${dbPrefix}_assets.deed d on d.locationID = u.locationID
    WHERE
      DAY(lse.startDate) <= 15
      AND d.startDate <= '${reportDate} AND (d.endDate >= '${reportDate} OR d.endDate IS NULL)
      AND d.ownerID IN (${ownerIDs.join(',')})
    GROUP BY
      d.ownerID

    UNION ALL

    SELECT
      d.ownerID,
      SUM(lse.rent) as total
    FROM ${dbPrefix}_assets.lease lse
      LEFT JOIN ${dbPrefix}_log.dates dates
        on dates.day > lse.startDate
        -- Continue to charge rent so long as the lease is marked "active"
        AND (
          (lse.active = 1 and dates.day <= '${reportDate})
          OR dates.day < lse.endDate
        )
      JOIN ${dbPrefix}_assets.unit u on u.unitID = lse.unitID
      JOIN ${dbPrefix}_assets.deed d on d.locationID = u.locationID
    WHERE
      d.startDate <= '${reportDate} AND (d.endDate >= '${reportDate} OR d.endDate IS NULL)
      AND d.ownerID IN (${inOwnerIDs})
    GROUP BY
      d.ownerID`;

  return sql;
}


function leaseAddonsByOwner({reportDate, ownerIDs}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const sql = `SELECT
      d.ownerID,
      SUM(rle.amount) as total
    FROM ${dbPrefix}_assets.lease lse
      LEFT JOIN ${dbPrefix}_log.dates dates
        on dates.day > lse.startDate
        -- Continue to charge rent so long as the lease is marked "active"
        AND (
          (lse.active = 1 and dates.day <= '${reportDate}')
          OR dates.day < lse.endDate
        )
      JOIN ${dbPrefix}_assets.unit u on u.unitID = lse.unitID
      JOIN ${dbPrefix}_assets.deed d on d.locationID = u.locationID
      LEFT JOIN ${dbPrefix}_assets.recurringLeaseEntries rle
        ON (rle.startDate <= dates.day and (rle.endDate >= dates.day OR rle.endDate IS NULL))
    WHERE
      d.startDate <= '${reportDate}' AND (d.endDate >= '${reportDate}' OR d.endDate IS NULL)
      AND d.ownerID IN (${inOwnerIDs})`

  return sql;
}


function adjAndFeesByOwner({reportDate, ownerIDs}) {
  const dbPrefix = db.getPrefix();
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const sql = ``
  return sql
}


function joinOnProp(prop, collections) {
  // Gather the unique IDS
  const uniqueIds = collections.reduce((ids, coll) => {
    if (coll[prop] && !ids.includes[coll[prop]]) {
      ids.push(coll[prop]);
    }
    return ids;
  }, []);


  return uniqueIds.map(id => {
    return collections.reduce((joined, coll) => {
      const itemsToMerge = [joined].concat(coll.filter(item => item[prop] === id));
      return Object.assign.apply(Object, itemsToMerge);
    }, {})
  })
}

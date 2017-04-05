CREATE TEMPORARY TABLE IF NOT EXISTS diffIDs AS (
  SELECT entryID
  FROM
  (
    SELECT DISTINCT entryID, leaseID, accountID, locationID, invoiceID, dateStamp, incomeID, amount, adjustment, feeAdded FROM (
      SELECT
        il.*
      FROM
        structudev_income.iLedger il
        LEFT JOIN structudev_assets.lease lse on il.leaseID = lse.leaseID
        LEFT JOIN structudev_assets.unit u on u.unitID = lse.unitID
        LEFT JOIN structudev_assets.location loc on loc.locationID = COALESCE(il.locationID, u.locationID)
        LEFT JOIN structudev_assets.owner own on own.ownerID = COALESCE(il.accountID, loc.ownerID)
      WHERE
        own.ownerID = 'terrilproperties'

      UNION ALL

      SELECT
        il.*
      FROM
        structudev10_income.iLedger il
        LEFT JOIN structudev10_assets.lease lse on il.leaseID = lse.leaseID
        LEFT JOIN structudev10_assets.unit u on u.unitID = lse.unitID
        LEFT JOIN structudev10_assets.location loc on loc.locationID = COALESCE(il.locationID, u.locationID)
        LEFT JOIN structudev10_assets.owner own on own.ownerID = COALESCE(il.accountID, loc.ownerID)
      WHERE
        own.ownerID = 'terrilproperties'
    ) a
  ) b
  GROUP BY entryID
  HAVING count(*) > 1
);

SELECT * FROM (
  SELECT * FROM structudev_income.iLedger il
  UNION ALL
  SELECT * FROM structudev10_income.iLedger il
) a
WHERE entryID in ( SELECT entryID from diffIDs)
ORDER BY entryID

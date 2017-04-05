CREATE TEMPORARY TABLE IF NOT EXISTS diffIDs AS (
  SELECT entryID
  FROM
  (
    SELECT DISTINCT entryID, recurringID, managerID, ownerID, locationID, unitID, createDate, dateStamp, dueDate, vendorID, expenseID, amount FROM (
      SELECT
        el.*
      FROM
        structudev_expenses.eLedger el
        LEFT JOIN structudev_expenses.recurring r on r.recurringID = el.recurringID
        LEFT JOIN structudev_assets.unit u on u.unitID = COALESCE(el.unitID, r.unitID)
        LEFT JOIN structudev_assets.location loc on loc.locationID = COALESCE(el.locationID, r.locationID, u.locationID)
        LEFT JOIN structudev_assets.owner own on own.ownerID = COALESCE(el.ownerID, r.ownerID, loc.ownerID)
      WHERE
        own.ownerID = 'terrilproperties'

      UNION ALL

      SELECT
        el.*
      FROM
        structudev10_expenses.eLedger el
        LEFT JOIN structudev10_expenses.recurring r on r.recurringID = el.recurringID
        LEFT JOIN structudev10_assets.unit u on u.unitID = COALESCE(el.unitID, r.unitID)
        LEFT JOIN structudev10_assets.location loc on loc.locationID = COALESCE(el.locationID, r.locationID, u.locationID)
        LEFT JOIN structudev10_assets.owner own on own.ownerID = COALESCE(el.ownerID, r.ownerID, loc.ownerID)
      WHERE
        own.ownerID = 'terrilproperties'
    ) a
  ) b
  GROUP BY entryID
  HAVING count(*) > 1
);

SELECT * FROM (
  SELECT * FROM structudev_expenses.eLedger
  UNION ALL
  SELECT * FROM structudev10_expenses.eLedger
) a
WHERE entryID in ( SELECT entryID from diffIDs)
ORDER BY entryID

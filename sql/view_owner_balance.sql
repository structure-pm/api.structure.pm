SET @ownerID='terrilproperties';
SET @startDate = '2016-01-01';
SET @endDate = '2017-03-05';


-- CREATE TEMPORARY TABLE IF NOT EXISTS ownerBalance AS (
--   SELECT * FROM (
--     (SELECT 1 as a)
--     UNION
--     (SELECT 2 as a)
--   ) sub
-- );
-- SELECT * FROM ownerBalance;

CREATE TEMPORARY TABLE IF NOT EXISTS ownerBalance AS (
  SELECT * FROM (
    (
      SELECT
        il.entryID, il.entryID AS iE, 0 AS eE, loc.locationID AS locationID, il.leaseID AS unitID,
        il.dateStamp, il.amount AS income, NULL AS expense, il.amount as amount, il.reconciled,
        il.leaseID AS vendorID, il.incomeID AS expenseID, NULL AS rLocationID, NULL AS rUnitID, NULL AS rVendorID,
        NULL AS rExpenseID, il.feeAdded, il.adjustment
    	FROM
        structudev_income.iLedger il
        LEFT JOIN structudev_assets.lease lse on il.leaseID = lse.leaseID
        LEFT JOIN structudev_assets.unit u on u.unitID = lse.unitID
        LEFT JOIN structudev_assets.location loc on loc.locationID = COALESCE(il.locationID, u.locationID)
        LEFT JOIN structudev_assets.owner own on own.ownerID = COALESCE(il.accountID, loc.ownerID)
    	WHERE
    		il.dateStamp BETWEEN @startDate AND @endDate
    		AND il.incomeID IS NOT NULL
        AND il.feeAdded != 1
        AND il.adjustment != 1
        AND own.ownerID=@ownerID
    )

    UNION

    (
      SELECT
        entryID, 0 AS iE, entryID AS eE, loc.locationID, el.unitID,
        dateStamp, NULL AS income, payment AS expense, -1* COALESCE(payment,0) as amount,
        reconciled, el.vendorID, el.expenseID, r.locationID rLocationID, r.unitID rUnitID,
        r.vendorID rVendorID, r.expenseID rExpenseID, NULL as feeAdded, NULL as adjustment
    	FROM
        structudev_expenses.eLedger el
        LEFT JOIN structudev_expenses.recurring r on r.recurringID = el.recurringID
        LEFT JOIN structudev_assets.unit u on u.unitID = COALESCE(el.unitID, r.unitID)
        LEFT JOIN structudev_assets.location loc on loc.locationID = COALESCE(el.locationID, r.locationID, u.locationID)
        LEFT JOIN structudev_assets.owner own on own.ownerID = COALESCE(el.ownerID, r.ownerID, loc.ownerID)
    	WHERE
    		el.dateStamp BETWEEN @startDate AND @endDate
        AND own.ownerID = @ownerID
    )
  ) sub
);

SELECT * FROM ownerBalance where dateStamp = '2017-02-21';


SET @runtot=0;
SELECT
  -- entryID,
  year, month, day,
  dayTotal,
  (@runtot := @runtot + dayTotal) AS balance
FROM (
  SELECT
    YEAR(dateStamp) as year,
    MONTH(dateStamp) as month,
    DAY(dateStamp) as day,
    SUM(amount) as dayTotal
  FROM
    ownerBalance
  GROUP BY YEAR(dateStamp), MONTH(dateStamp), DAY(dateStamp)
  ORDER BY YEAR(dateStamp), MONTH(dateStamp), DAY(dateStamp)
) ob
LIMIT 1000;

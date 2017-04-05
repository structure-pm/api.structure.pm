
USE structu_income;

CREATE TABLE IF NOT EXISTS deposits (
  depID INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  depDate DATE NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- SELECT depID, COUNT(*) FROM (
-- SELECT DISTINCT depID, depDate
-- FROM
--   structudev_income.iLedger
-- WHERE
--   depID IS NOT NULL
--   AND depID != 0
--   AND depDate IS NOT NULL
--   AND depDate > '2016-01-01'
-- ) a
-- GROUP BY depID
-- HAVING count(*) > 1


INSERT INTO deposits (depID, depDate)
  SELECT DISTINCT depID, depDate
  FROM iLedger
  WHERE
    depID IS NOT NULL
    AND depID != 0
    AND depDate IS NOT NULL
    AND depDate > '2016-01-01'
;



-- =============================
-- DE-INTERTWINE DEPOSITS
USE structudev_income;
SET @rank=0;

CREATE TEMPORARY TABLE IF NOT EXISTS depPairs AS (
  SELECT DISTINCT il.depID, own.ownerID
  FROM
    structudev_income.iLedger il
    LEFT JOIN structudev_assets.lease lse on il.leaseID = lse.leaseID
    LEFT JOIN structudev_assets.unit u on u.unitID = lse.unitID
    LEFT JOIN structudev_assets.location loc on loc.locationID = COALESCE(il.locationID, u.locationID)
    LEFT JOIN structudev_assets.owner own on own.ownerID = COALESCE(il.accountID, loc.ownerID)
  WHERE
    il.depID IS NOT NULL
    AND il.depID != 0
    AND il.depDate IS NOT NULL
    AND il.depDate > '2016-01-01'
  GROUP BY
    il.depID, own.ownerID
);

CREATE TEMPORARY TABLE IF NOT EXISTS dupIDs AS (
  SELECT depID
  FROM depPairs
  GROUP BY depID
  HAVING count(*) > 1
);

CREATE TEMPORARY TABLE IF NOT EXISTS dupes AS (
  SELECT
    depPairs.*,
    @rank:=@rank+1 AS rank,
    did.max,
    did.max + @rank as newDepId
  FROM
    depPairs
    LEFT JOIN (SELECT MAX(depID) as max FROM structudev_income.iLedger) did on 1=1
  WHERE
    depPairs.depID in (SELECT depID from dupIDs)
);


-- SELECT
--   d.*,
--   il.entryID,
--   il.depID,
--   own.ownerID
-- FROM
--   structudev_income.iLedger il
--   LEFT JOIN structudev_assets.lease lse on il.leaseID = lse.leaseID
--   LEFT JOIN structudev_assets.unit u on u.unitID = lse.unitID
--   LEFT JOIN structudev_assets.location loc on loc.locationID = COALESCE(il.locationID, u.locationID)
--   LEFT JOIN structudev_assets.owner own on own.ownerID = COALESCE(il.accountID, loc.ownerID)
--   LEFT JOIN dupes d on d.depID = il.depID AND d.ownerID=own.ownerID
-- WHERE
--   il.depID in (SELECT depID from dupIDs)
-- LIMIT 1000


UPDATE
  structudev_income.iLedger il
  LEFT JOIN structudev_assets.lease lse on il.leaseID = lse.leaseID
  LEFT JOIN structudev_assets.unit u on u.unitID = lse.unitID
  LEFT JOIN structudev_assets.location loc on loc.locationID = COALESCE(il.locationID, u.locationID)
  LEFT JOIN structudev_assets.owner own on own.ownerID = COALESCE(il.accountID, loc.ownerID)
  LEFT JOIN dupes d on d.depID = il.depID AND d.ownerID=own.ownerID
SET
  il.depID = d.newDepId
WHERE
  il.depID in (SELECT depID from dupIDs);

UPDATE
  structudev_income.receivedPayment rp
  LEFT JOIN structudev_assets.lease lse on rp.leaseID = lse.leaseID
  LEFT JOIN structudev_assets.unit u on u.unitID = lse.unitID
  LEFT JOIN structudev_assets.location loc on loc.locationID = COALESCE(rp.locationID, u.locationID)
  LEFT JOIN structudev_assets.owner own on own.ownerID = COALESCE(rp.accountID, loc.ownerID)
  LEFT JOIN dupes d on d.depID = rp.depID AND d.ownerID=own.ownerID
SET
  rp.depID = d.newDepId
WHERE
  rp.depID in (SELECT depID from dupIDs);

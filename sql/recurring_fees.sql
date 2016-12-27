USE structu_assets;

CREATE TABLE IF NOT EXISTS recurringLeaseEntries (
  id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
  leaseID INT NOT NULL,
  incomeID INT NOT NULL,
  isCredit BOOL NOT NULL,
  name VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  startDate DATE NOT NULL,
  endDate DATE,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE recurringLeaseEntries ADD INDEX (leaseID);

ALTER TABLE structu_income.income
ADD COLUMN isAssignable BOOL DEFAULT 0;

UPDATE structu_income.income
SET isAssignable = true
WHERE incomeID in ( 1, 3, 7, 9, 10, 11, 12, 17, 30 );


-- INSERT EXISTING MONTHLY FEES/CREDITS IN TO RECURRING TABLE
INSERT INTO structu_assets.recurringLeaseEntries
  (leaseID, incomeID, isCredit, name, amount, startDate, endDate)
SELECT leaseID, incomeID, isCredit, name, amount, startDate, NULL FROM (
  SELECT
    leaseID,
    1             as incomeID,
    -- Tenant Balance is a credit normal account so "ACH Credit" is not meant
    -- in the same sense as an accounting credit
    0             as isCredit,
    'ACH Credit'  as name,
    achCred       as amount,
    startDate
  FROM structu_assets.lease
  WHERE
    ach = 1 AND achCred > 0
  UNION ALL
  SELECT
    leaseID,
    1           as incomeID,
    1           as isCredit,
    'Wireless'  as name,
    wireless    as amount,
    startDate
  FROM structu_assets.lease
  WHERE
    wireless IS NOT NULL AND wireless > 0
  UNION ALL
  SELECT
    leaseID,
    1           as incomeID,
    1           as isCredit,
    'Pet Rent'  as name,
    petRent     as amount,
    startDate
  FROM structu_assets.lease
  WHERE
    petRent IS NOT NULL AND petRent > 0
  UNION ALL
  SELECT
    leaseID,
    1                as incomeID,
    1                as isCredit,
    otherChargeDesc1 as name,
    otherCharge1     as amount,
    startDate
  FROM structu_assets.lease
  WHERE
    otherCharge1 IS NOT NULL AND otherCharge1 > 0
  UNION ALL
  SELECT
    leaseID,
    1                as incomeID,
    1                as isCredit,
    otherChargeDesc2 as name,
    otherCharge2     as amount,
    startDate
  FROM structu_assets.lease
  WHERE
    otherCharge2 IS NOT NULL AND otherCharge2 > 0
) fees;



USE structu_log;

CREATE TABLE IF NOT EXISTS dates (
  year INT,
  month INT,
  day DATE
);



-- for (var year= 2006; year <=2050; year++) {
--   for (var month=1; month <=12; month++) {
--     var m = ('0000' + month).split('').reverse().slice(0,2).reverse().join('');
--     console.log("INSERT INTO structu_log.dates VALUES (" + year + ", " + month + ", '" + year + '-' + m + "-01');");
--   }
-- }
INSERT INTO structu_log.dates VALUES (2006, 1, '2006-01-01');
INSERT INTO structu_log.dates VALUES (2006, 2, '2006-02-01');
INSERT INTO structu_log.dates VALUES (2006, 3, '2006-03-01');
INSERT INTO structu_log.dates VALUES (2006, 4, '2006-04-01');
INSERT INTO structu_log.dates VALUES (2006, 5, '2006-05-01');
INSERT INTO structu_log.dates VALUES (2006, 6, '2006-06-01');
INSERT INTO structu_log.dates VALUES (2006, 7, '2006-07-01');
INSERT INTO structu_log.dates VALUES (2006, 8, '2006-08-01');
INSERT INTO structu_log.dates VALUES (2006, 9, '2006-09-01');
INSERT INTO structu_log.dates VALUES (2006, 10, '2006-10-01');
INSERT INTO structu_log.dates VALUES (2006, 11, '2006-11-01');
INSERT INTO structu_log.dates VALUES (2006, 12, '2006-12-01');
INSERT INTO structu_log.dates VALUES (2007, 1, '2007-01-01');
INSERT INTO structu_log.dates VALUES (2007, 2, '2007-02-01');
INSERT INTO structu_log.dates VALUES (2007, 3, '2007-03-01');
INSERT INTO structu_log.dates VALUES (2007, 4, '2007-04-01');
INSERT INTO structu_log.dates VALUES (2007, 5, '2007-05-01');
INSERT INTO structu_log.dates VALUES (2007, 6, '2007-06-01');
INSERT INTO structu_log.dates VALUES (2007, 7, '2007-07-01');
INSERT INTO structu_log.dates VALUES (2007, 8, '2007-08-01');
INSERT INTO structu_log.dates VALUES (2007, 9, '2007-09-01');
INSERT INTO structu_log.dates VALUES (2007, 10, '2007-10-01');
INSERT INTO structu_log.dates VALUES (2007, 11, '2007-11-01');
INSERT INTO structu_log.dates VALUES (2007, 12, '2007-12-01');
INSERT INTO structu_log.dates VALUES (2008, 1, '2008-01-01');
INSERT INTO structu_log.dates VALUES (2008, 2, '2008-02-01');
INSERT INTO structu_log.dates VALUES (2008, 3, '2008-03-01');
INSERT INTO structu_log.dates VALUES (2008, 4, '2008-04-01');
INSERT INTO structu_log.dates VALUES (2008, 5, '2008-05-01');
INSERT INTO structu_log.dates VALUES (2008, 6, '2008-06-01');
INSERT INTO structu_log.dates VALUES (2008, 7, '2008-07-01');
INSERT INTO structu_log.dates VALUES (2008, 8, '2008-08-01');
INSERT INTO structu_log.dates VALUES (2008, 9, '2008-09-01');
INSERT INTO structu_log.dates VALUES (2008, 10, '2008-10-01');
INSERT INTO structu_log.dates VALUES (2008, 11, '2008-11-01');
INSERT INTO structu_log.dates VALUES (2008, 12, '2008-12-01');
INSERT INTO structu_log.dates VALUES (2009, 1, '2009-01-01');
INSERT INTO structu_log.dates VALUES (2009, 2, '2009-02-01');
INSERT INTO structu_log.dates VALUES (2009, 3, '2009-03-01');
INSERT INTO structu_log.dates VALUES (2009, 4, '2009-04-01');
INSERT INTO structu_log.dates VALUES (2009, 5, '2009-05-01');
INSERT INTO structu_log.dates VALUES (2009, 6, '2009-06-01');
INSERT INTO structu_log.dates VALUES (2009, 7, '2009-07-01');
INSERT INTO structu_log.dates VALUES (2009, 8, '2009-08-01');
INSERT INTO structu_log.dates VALUES (2009, 9, '2009-09-01');
INSERT INTO structu_log.dates VALUES (2009, 10, '2009-10-01');
INSERT INTO structu_log.dates VALUES (2009, 11, '2009-11-01');
INSERT INTO structu_log.dates VALUES (2009, 12, '2009-12-01');
INSERT INTO structu_log.dates VALUES (2010, 1, '2010-01-01');
INSERT INTO structu_log.dates VALUES (2010, 2, '2010-02-01');
INSERT INTO structu_log.dates VALUES (2010, 3, '2010-03-01');
INSERT INTO structu_log.dates VALUES (2010, 4, '2010-04-01');
INSERT INTO structu_log.dates VALUES (2010, 5, '2010-05-01');
INSERT INTO structu_log.dates VALUES (2010, 6, '2010-06-01');
INSERT INTO structu_log.dates VALUES (2010, 7, '2010-07-01');
INSERT INTO structu_log.dates VALUES (2010, 8, '2010-08-01');
INSERT INTO structu_log.dates VALUES (2010, 9, '2010-09-01');
INSERT INTO structu_log.dates VALUES (2010, 10, '2010-10-01');
INSERT INTO structu_log.dates VALUES (2010, 11, '2010-11-01');
INSERT INTO structu_log.dates VALUES (2010, 12, '2010-12-01');
INSERT INTO structu_log.dates VALUES (2011, 1, '2011-01-01');
INSERT INTO structu_log.dates VALUES (2011, 2, '2011-02-01');
INSERT INTO structu_log.dates VALUES (2011, 3, '2011-03-01');
INSERT INTO structu_log.dates VALUES (2011, 4, '2011-04-01');
INSERT INTO structu_log.dates VALUES (2011, 5, '2011-05-01');
INSERT INTO structu_log.dates VALUES (2011, 6, '2011-06-01');
INSERT INTO structu_log.dates VALUES (2011, 7, '2011-07-01');
INSERT INTO structu_log.dates VALUES (2011, 8, '2011-08-01');
INSERT INTO structu_log.dates VALUES (2011, 9, '2011-09-01');
INSERT INTO structu_log.dates VALUES (2011, 10, '2011-10-01');
INSERT INTO structu_log.dates VALUES (2011, 11, '2011-11-01');
INSERT INTO structu_log.dates VALUES (2011, 12, '2011-12-01');
INSERT INTO structu_log.dates VALUES (2012, 1, '2012-01-01');
INSERT INTO structu_log.dates VALUES (2012, 2, '2012-02-01');
INSERT INTO structu_log.dates VALUES (2012, 3, '2012-03-01');
INSERT INTO structu_log.dates VALUES (2012, 4, '2012-04-01');
INSERT INTO structu_log.dates VALUES (2012, 5, '2012-05-01');
INSERT INTO structu_log.dates VALUES (2012, 6, '2012-06-01');
INSERT INTO structu_log.dates VALUES (2012, 7, '2012-07-01');
INSERT INTO structu_log.dates VALUES (2012, 8, '2012-08-01');
INSERT INTO structu_log.dates VALUES (2012, 9, '2012-09-01');
INSERT INTO structu_log.dates VALUES (2012, 10, '2012-10-01');
INSERT INTO structu_log.dates VALUES (2012, 11, '2012-11-01');
INSERT INTO structu_log.dates VALUES (2012, 12, '2012-12-01');
INSERT INTO structu_log.dates VALUES (2013, 1, '2013-01-01');
INSERT INTO structu_log.dates VALUES (2013, 2, '2013-02-01');
INSERT INTO structu_log.dates VALUES (2013, 3, '2013-03-01');
INSERT INTO structu_log.dates VALUES (2013, 4, '2013-04-01');
INSERT INTO structu_log.dates VALUES (2013, 5, '2013-05-01');
INSERT INTO structu_log.dates VALUES (2013, 6, '2013-06-01');
INSERT INTO structu_log.dates VALUES (2013, 7, '2013-07-01');
INSERT INTO structu_log.dates VALUES (2013, 8, '2013-08-01');
INSERT INTO structu_log.dates VALUES (2013, 9, '2013-09-01');
INSERT INTO structu_log.dates VALUES (2013, 10, '2013-10-01');
INSERT INTO structu_log.dates VALUES (2013, 11, '2013-11-01');
INSERT INTO structu_log.dates VALUES (2013, 12, '2013-12-01');
INSERT INTO structu_log.dates VALUES (2014, 1, '2014-01-01');
INSERT INTO structu_log.dates VALUES (2014, 2, '2014-02-01');
INSERT INTO structu_log.dates VALUES (2014, 3, '2014-03-01');
INSERT INTO structu_log.dates VALUES (2014, 4, '2014-04-01');
INSERT INTO structu_log.dates VALUES (2014, 5, '2014-05-01');
INSERT INTO structu_log.dates VALUES (2014, 6, '2014-06-01');
INSERT INTO structu_log.dates VALUES (2014, 7, '2014-07-01');
INSERT INTO structu_log.dates VALUES (2014, 8, '2014-08-01');
INSERT INTO structu_log.dates VALUES (2014, 9, '2014-09-01');
INSERT INTO structu_log.dates VALUES (2014, 10, '2014-10-01');
INSERT INTO structu_log.dates VALUES (2014, 11, '2014-11-01');
INSERT INTO structu_log.dates VALUES (2014, 12, '2014-12-01');
INSERT INTO structu_log.dates VALUES (2015, 1, '2015-01-01');
INSERT INTO structu_log.dates VALUES (2015, 2, '2015-02-01');
INSERT INTO structu_log.dates VALUES (2015, 3, '2015-03-01');
INSERT INTO structu_log.dates VALUES (2015, 4, '2015-04-01');
INSERT INTO structu_log.dates VALUES (2015, 5, '2015-05-01');
INSERT INTO structu_log.dates VALUES (2015, 6, '2015-06-01');
INSERT INTO structu_log.dates VALUES (2015, 7, '2015-07-01');
INSERT INTO structu_log.dates VALUES (2015, 8, '2015-08-01');
INSERT INTO structu_log.dates VALUES (2015, 9, '2015-09-01');
INSERT INTO structu_log.dates VALUES (2015, 10, '2015-10-01');
INSERT INTO structu_log.dates VALUES (2015, 11, '2015-11-01');
INSERT INTO structu_log.dates VALUES (2015, 12, '2015-12-01');
INSERT INTO structu_log.dates VALUES (2016, 1, '2016-01-01');
INSERT INTO structu_log.dates VALUES (2016, 2, '2016-02-01');
INSERT INTO structu_log.dates VALUES (2016, 3, '2016-03-01');
INSERT INTO structu_log.dates VALUES (2016, 4, '2016-04-01');
INSERT INTO structu_log.dates VALUES (2016, 5, '2016-05-01');
INSERT INTO structu_log.dates VALUES (2016, 6, '2016-06-01');
INSERT INTO structu_log.dates VALUES (2016, 7, '2016-07-01');
INSERT INTO structu_log.dates VALUES (2016, 8, '2016-08-01');
INSERT INTO structu_log.dates VALUES (2016, 9, '2016-09-01');
INSERT INTO structu_log.dates VALUES (2016, 10, '2016-10-01');
INSERT INTO structu_log.dates VALUES (2016, 11, '2016-11-01');
INSERT INTO structu_log.dates VALUES (2016, 12, '2016-12-01');
INSERT INTO structu_log.dates VALUES (2017, 1, '2017-01-01');
INSERT INTO structu_log.dates VALUES (2017, 2, '2017-02-01');
INSERT INTO structu_log.dates VALUES (2017, 3, '2017-03-01');
INSERT INTO structu_log.dates VALUES (2017, 4, '2017-04-01');
INSERT INTO structu_log.dates VALUES (2017, 5, '2017-05-01');
INSERT INTO structu_log.dates VALUES (2017, 6, '2017-06-01');
INSERT INTO structu_log.dates VALUES (2017, 7, '2017-07-01');
INSERT INTO structu_log.dates VALUES (2017, 8, '2017-08-01');
INSERT INTO structu_log.dates VALUES (2017, 9, '2017-09-01');
INSERT INTO structu_log.dates VALUES (2017, 10, '2017-10-01');
INSERT INTO structu_log.dates VALUES (2017, 11, '2017-11-01');
INSERT INTO structu_log.dates VALUES (2017, 12, '2017-12-01');
INSERT INTO structu_log.dates VALUES (2018, 1, '2018-01-01');
INSERT INTO structu_log.dates VALUES (2018, 2, '2018-02-01');
INSERT INTO structu_log.dates VALUES (2018, 3, '2018-03-01');
INSERT INTO structu_log.dates VALUES (2018, 4, '2018-04-01');
INSERT INTO structu_log.dates VALUES (2018, 5, '2018-05-01');
INSERT INTO structu_log.dates VALUES (2018, 6, '2018-06-01');
INSERT INTO structu_log.dates VALUES (2018, 7, '2018-07-01');
INSERT INTO structu_log.dates VALUES (2018, 8, '2018-08-01');
INSERT INTO structu_log.dates VALUES (2018, 9, '2018-09-01');
INSERT INTO structu_log.dates VALUES (2018, 10, '2018-10-01');
INSERT INTO structu_log.dates VALUES (2018, 11, '2018-11-01');
INSERT INTO structu_log.dates VALUES (2018, 12, '2018-12-01');
INSERT INTO structu_log.dates VALUES (2019, 1, '2019-01-01');
INSERT INTO structu_log.dates VALUES (2019, 2, '2019-02-01');
INSERT INTO structu_log.dates VALUES (2019, 3, '2019-03-01');
INSERT INTO structu_log.dates VALUES (2019, 4, '2019-04-01');
INSERT INTO structu_log.dates VALUES (2019, 5, '2019-05-01');
INSERT INTO structu_log.dates VALUES (2019, 6, '2019-06-01');
INSERT INTO structu_log.dates VALUES (2019, 7, '2019-07-01');
INSERT INTO structu_log.dates VALUES (2019, 8, '2019-08-01');
INSERT INTO structu_log.dates VALUES (2019, 9, '2019-09-01');
INSERT INTO structu_log.dates VALUES (2019, 10, '2019-10-01');
INSERT INTO structu_log.dates VALUES (2019, 11, '2019-11-01');
INSERT INTO structu_log.dates VALUES (2019, 12, '2019-12-01');
INSERT INTO structu_log.dates VALUES (2020, 1, '2020-01-01');
INSERT INTO structu_log.dates VALUES (2020, 2, '2020-02-01');
INSERT INTO structu_log.dates VALUES (2020, 3, '2020-03-01');
INSERT INTO structu_log.dates VALUES (2020, 4, '2020-04-01');
INSERT INTO structu_log.dates VALUES (2020, 5, '2020-05-01');
INSERT INTO structu_log.dates VALUES (2020, 6, '2020-06-01');
INSERT INTO structu_log.dates VALUES (2020, 7, '2020-07-01');
INSERT INTO structu_log.dates VALUES (2020, 8, '2020-08-01');
INSERT INTO structu_log.dates VALUES (2020, 9, '2020-09-01');
INSERT INTO structu_log.dates VALUES (2020, 10, '2020-10-01');
INSERT INTO structu_log.dates VALUES (2020, 11, '2020-11-01');
INSERT INTO structu_log.dates VALUES (2020, 12, '2020-12-01');
INSERT INTO structu_log.dates VALUES (2021, 1, '2021-01-01');
INSERT INTO structu_log.dates VALUES (2021, 2, '2021-02-01');
INSERT INTO structu_log.dates VALUES (2021, 3, '2021-03-01');
INSERT INTO structu_log.dates VALUES (2021, 4, '2021-04-01');
INSERT INTO structu_log.dates VALUES (2021, 5, '2021-05-01');
INSERT INTO structu_log.dates VALUES (2021, 6, '2021-06-01');
INSERT INTO structu_log.dates VALUES (2021, 7, '2021-07-01');
INSERT INTO structu_log.dates VALUES (2021, 8, '2021-08-01');
INSERT INTO structu_log.dates VALUES (2021, 9, '2021-09-01');
INSERT INTO structu_log.dates VALUES (2021, 10, '2021-10-01');
INSERT INTO structu_log.dates VALUES (2021, 11, '2021-11-01');
INSERT INTO structu_log.dates VALUES (2021, 12, '2021-12-01');
INSERT INTO structu_log.dates VALUES (2022, 1, '2022-01-01');
INSERT INTO structu_log.dates VALUES (2022, 2, '2022-02-01');
INSERT INTO structu_log.dates VALUES (2022, 3, '2022-03-01');
INSERT INTO structu_log.dates VALUES (2022, 4, '2022-04-01');
INSERT INTO structu_log.dates VALUES (2022, 5, '2022-05-01');
INSERT INTO structu_log.dates VALUES (2022, 6, '2022-06-01');
INSERT INTO structu_log.dates VALUES (2022, 7, '2022-07-01');
INSERT INTO structu_log.dates VALUES (2022, 8, '2022-08-01');
INSERT INTO structu_log.dates VALUES (2022, 9, '2022-09-01');
INSERT INTO structu_log.dates VALUES (2022, 10, '2022-10-01');
INSERT INTO structu_log.dates VALUES (2022, 11, '2022-11-01');
INSERT INTO structu_log.dates VALUES (2022, 12, '2022-12-01');
INSERT INTO structu_log.dates VALUES (2023, 1, '2023-01-01');
INSERT INTO structu_log.dates VALUES (2023, 2, '2023-02-01');
INSERT INTO structu_log.dates VALUES (2023, 3, '2023-03-01');
INSERT INTO structu_log.dates VALUES (2023, 4, '2023-04-01');
INSERT INTO structu_log.dates VALUES (2023, 5, '2023-05-01');
INSERT INTO structu_log.dates VALUES (2023, 6, '2023-06-01');
INSERT INTO structu_log.dates VALUES (2023, 7, '2023-07-01');
INSERT INTO structu_log.dates VALUES (2023, 8, '2023-08-01');
INSERT INTO structu_log.dates VALUES (2023, 9, '2023-09-01');
INSERT INTO structu_log.dates VALUES (2023, 10, '2023-10-01');
INSERT INTO structu_log.dates VALUES (2023, 11, '2023-11-01');
INSERT INTO structu_log.dates VALUES (2023, 12, '2023-12-01');
INSERT INTO structu_log.dates VALUES (2024, 1, '2024-01-01');
INSERT INTO structu_log.dates VALUES (2024, 2, '2024-02-01');
INSERT INTO structu_log.dates VALUES (2024, 3, '2024-03-01');
INSERT INTO structu_log.dates VALUES (2024, 4, '2024-04-01');
INSERT INTO structu_log.dates VALUES (2024, 5, '2024-05-01');
INSERT INTO structu_log.dates VALUES (2024, 6, '2024-06-01');
INSERT INTO structu_log.dates VALUES (2024, 7, '2024-07-01');
INSERT INTO structu_log.dates VALUES (2024, 8, '2024-08-01');
INSERT INTO structu_log.dates VALUES (2024, 9, '2024-09-01');
INSERT INTO structu_log.dates VALUES (2024, 10, '2024-10-01');
INSERT INTO structu_log.dates VALUES (2024, 11, '2024-11-01');
INSERT INTO structu_log.dates VALUES (2024, 12, '2024-12-01');
INSERT INTO structu_log.dates VALUES (2025, 1, '2025-01-01');
INSERT INTO structu_log.dates VALUES (2025, 2, '2025-02-01');
INSERT INTO structu_log.dates VALUES (2025, 3, '2025-03-01');
INSERT INTO structu_log.dates VALUES (2025, 4, '2025-04-01');
INSERT INTO structu_log.dates VALUES (2025, 5, '2025-05-01');
INSERT INTO structu_log.dates VALUES (2025, 6, '2025-06-01');
INSERT INTO structu_log.dates VALUES (2025, 7, '2025-07-01');
INSERT INTO structu_log.dates VALUES (2025, 8, '2025-08-01');
INSERT INTO structu_log.dates VALUES (2025, 9, '2025-09-01');
INSERT INTO structu_log.dates VALUES (2025, 10, '2025-10-01');
INSERT INTO structu_log.dates VALUES (2025, 11, '2025-11-01');
INSERT INTO structu_log.dates VALUES (2025, 12, '2025-12-01');
INSERT INTO structu_log.dates VALUES (2026, 1, '2026-01-01');
INSERT INTO structu_log.dates VALUES (2026, 2, '2026-02-01');
INSERT INTO structu_log.dates VALUES (2026, 3, '2026-03-01');
INSERT INTO structu_log.dates VALUES (2026, 4, '2026-04-01');
INSERT INTO structu_log.dates VALUES (2026, 5, '2026-05-01');
INSERT INTO structu_log.dates VALUES (2026, 6, '2026-06-01');
INSERT INTO structu_log.dates VALUES (2026, 7, '2026-07-01');
INSERT INTO structu_log.dates VALUES (2026, 8, '2026-08-01');
INSERT INTO structu_log.dates VALUES (2026, 9, '2026-09-01');
INSERT INTO structu_log.dates VALUES (2026, 10, '2026-10-01');
INSERT INTO structu_log.dates VALUES (2026, 11, '2026-11-01');
INSERT INTO structu_log.dates VALUES (2026, 12, '2026-12-01');
INSERT INTO structu_log.dates VALUES (2027, 1, '2027-01-01');
INSERT INTO structu_log.dates VALUES (2027, 2, '2027-02-01');
INSERT INTO structu_log.dates VALUES (2027, 3, '2027-03-01');
INSERT INTO structu_log.dates VALUES (2027, 4, '2027-04-01');
INSERT INTO structu_log.dates VALUES (2027, 5, '2027-05-01');
INSERT INTO structu_log.dates VALUES (2027, 6, '2027-06-01');
INSERT INTO structu_log.dates VALUES (2027, 7, '2027-07-01');
INSERT INTO structu_log.dates VALUES (2027, 8, '2027-08-01');
INSERT INTO structu_log.dates VALUES (2027, 9, '2027-09-01');
INSERT INTO structu_log.dates VALUES (2027, 10, '2027-10-01');
INSERT INTO structu_log.dates VALUES (2027, 11, '2027-11-01');
INSERT INTO structu_log.dates VALUES (2027, 12, '2027-12-01');
INSERT INTO structu_log.dates VALUES (2028, 1, '2028-01-01');
INSERT INTO structu_log.dates VALUES (2028, 2, '2028-02-01');
INSERT INTO structu_log.dates VALUES (2028, 3, '2028-03-01');
INSERT INTO structu_log.dates VALUES (2028, 4, '2028-04-01');
INSERT INTO structu_log.dates VALUES (2028, 5, '2028-05-01');
INSERT INTO structu_log.dates VALUES (2028, 6, '2028-06-01');
INSERT INTO structu_log.dates VALUES (2028, 7, '2028-07-01');
INSERT INTO structu_log.dates VALUES (2028, 8, '2028-08-01');
INSERT INTO structu_log.dates VALUES (2028, 9, '2028-09-01');
INSERT INTO structu_log.dates VALUES (2028, 10, '2028-10-01');
INSERT INTO structu_log.dates VALUES (2028, 11, '2028-11-01');
INSERT INTO structu_log.dates VALUES (2028, 12, '2028-12-01');
INSERT INTO structu_log.dates VALUES (2029, 1, '2029-01-01');
INSERT INTO structu_log.dates VALUES (2029, 2, '2029-02-01');
INSERT INTO structu_log.dates VALUES (2029, 3, '2029-03-01');
INSERT INTO structu_log.dates VALUES (2029, 4, '2029-04-01');
INSERT INTO structu_log.dates VALUES (2029, 5, '2029-05-01');
INSERT INTO structu_log.dates VALUES (2029, 6, '2029-06-01');
INSERT INTO structu_log.dates VALUES (2029, 7, '2029-07-01');
INSERT INTO structu_log.dates VALUES (2029, 8, '2029-08-01');
INSERT INTO structu_log.dates VALUES (2029, 9, '2029-09-01');
INSERT INTO structu_log.dates VALUES (2029, 10, '2029-10-01');
INSERT INTO structu_log.dates VALUES (2029, 11, '2029-11-01');
INSERT INTO structu_log.dates VALUES (2029, 12, '2029-12-01');
INSERT INTO structu_log.dates VALUES (2030, 1, '2030-01-01');
INSERT INTO structu_log.dates VALUES (2030, 2, '2030-02-01');
INSERT INTO structu_log.dates VALUES (2030, 3, '2030-03-01');
INSERT INTO structu_log.dates VALUES (2030, 4, '2030-04-01');
INSERT INTO structu_log.dates VALUES (2030, 5, '2030-05-01');
INSERT INTO structu_log.dates VALUES (2030, 6, '2030-06-01');
INSERT INTO structu_log.dates VALUES (2030, 7, '2030-07-01');
INSERT INTO structu_log.dates VALUES (2030, 8, '2030-08-01');
INSERT INTO structu_log.dates VALUES (2030, 9, '2030-09-01');
INSERT INTO structu_log.dates VALUES (2030, 10, '2030-10-01');
INSERT INTO structu_log.dates VALUES (2030, 11, '2030-11-01');
INSERT INTO structu_log.dates VALUES (2030, 12, '2030-12-01');
INSERT INTO structu_log.dates VALUES (2031, 1, '2031-01-01');
INSERT INTO structu_log.dates VALUES (2031, 2, '2031-02-01');
INSERT INTO structu_log.dates VALUES (2031, 3, '2031-03-01');
INSERT INTO structu_log.dates VALUES (2031, 4, '2031-04-01');
INSERT INTO structu_log.dates VALUES (2031, 5, '2031-05-01');
INSERT INTO structu_log.dates VALUES (2031, 6, '2031-06-01');
INSERT INTO structu_log.dates VALUES (2031, 7, '2031-07-01');
INSERT INTO structu_log.dates VALUES (2031, 8, '2031-08-01');
INSERT INTO structu_log.dates VALUES (2031, 9, '2031-09-01');
INSERT INTO structu_log.dates VALUES (2031, 10, '2031-10-01');
INSERT INTO structu_log.dates VALUES (2031, 11, '2031-11-01');
INSERT INTO structu_log.dates VALUES (2031, 12, '2031-12-01');
INSERT INTO structu_log.dates VALUES (2032, 1, '2032-01-01');
INSERT INTO structu_log.dates VALUES (2032, 2, '2032-02-01');
INSERT INTO structu_log.dates VALUES (2032, 3, '2032-03-01');
INSERT INTO structu_log.dates VALUES (2032, 4, '2032-04-01');
INSERT INTO structu_log.dates VALUES (2032, 5, '2032-05-01');
INSERT INTO structu_log.dates VALUES (2032, 6, '2032-06-01');
INSERT INTO structu_log.dates VALUES (2032, 7, '2032-07-01');
INSERT INTO structu_log.dates VALUES (2032, 8, '2032-08-01');
INSERT INTO structu_log.dates VALUES (2032, 9, '2032-09-01');
INSERT INTO structu_log.dates VALUES (2032, 10, '2032-10-01');
INSERT INTO structu_log.dates VALUES (2032, 11, '2032-11-01');
INSERT INTO structu_log.dates VALUES (2032, 12, '2032-12-01');
INSERT INTO structu_log.dates VALUES (2033, 1, '2033-01-01');
INSERT INTO structu_log.dates VALUES (2033, 2, '2033-02-01');
INSERT INTO structu_log.dates VALUES (2033, 3, '2033-03-01');
INSERT INTO structu_log.dates VALUES (2033, 4, '2033-04-01');
INSERT INTO structu_log.dates VALUES (2033, 5, '2033-05-01');
INSERT INTO structu_log.dates VALUES (2033, 6, '2033-06-01');
INSERT INTO structu_log.dates VALUES (2033, 7, '2033-07-01');
INSERT INTO structu_log.dates VALUES (2033, 8, '2033-08-01');
INSERT INTO structu_log.dates VALUES (2033, 9, '2033-09-01');
INSERT INTO structu_log.dates VALUES (2033, 10, '2033-10-01');
INSERT INTO structu_log.dates VALUES (2033, 11, '2033-11-01');
INSERT INTO structu_log.dates VALUES (2033, 12, '2033-12-01');
INSERT INTO structu_log.dates VALUES (2034, 1, '2034-01-01');
INSERT INTO structu_log.dates VALUES (2034, 2, '2034-02-01');
INSERT INTO structu_log.dates VALUES (2034, 3, '2034-03-01');
INSERT INTO structu_log.dates VALUES (2034, 4, '2034-04-01');
INSERT INTO structu_log.dates VALUES (2034, 5, '2034-05-01');
INSERT INTO structu_log.dates VALUES (2034, 6, '2034-06-01');
INSERT INTO structu_log.dates VALUES (2034, 7, '2034-07-01');
INSERT INTO structu_log.dates VALUES (2034, 8, '2034-08-01');
INSERT INTO structu_log.dates VALUES (2034, 9, '2034-09-01');
INSERT INTO structu_log.dates VALUES (2034, 10, '2034-10-01');
INSERT INTO structu_log.dates VALUES (2034, 11, '2034-11-01');
INSERT INTO structu_log.dates VALUES (2034, 12, '2034-12-01');
INSERT INTO structu_log.dates VALUES (2035, 1, '2035-01-01');
INSERT INTO structu_log.dates VALUES (2035, 2, '2035-02-01');
INSERT INTO structu_log.dates VALUES (2035, 3, '2035-03-01');
INSERT INTO structu_log.dates VALUES (2035, 4, '2035-04-01');
INSERT INTO structu_log.dates VALUES (2035, 5, '2035-05-01');
INSERT INTO structu_log.dates VALUES (2035, 6, '2035-06-01');
INSERT INTO structu_log.dates VALUES (2035, 7, '2035-07-01');
INSERT INTO structu_log.dates VALUES (2035, 8, '2035-08-01');
INSERT INTO structu_log.dates VALUES (2035, 9, '2035-09-01');
INSERT INTO structu_log.dates VALUES (2035, 10, '2035-10-01');
INSERT INTO structu_log.dates VALUES (2035, 11, '2035-11-01');
INSERT INTO structu_log.dates VALUES (2035, 12, '2035-12-01');
INSERT INTO structu_log.dates VALUES (2036, 1, '2036-01-01');
INSERT INTO structu_log.dates VALUES (2036, 2, '2036-02-01');
INSERT INTO structu_log.dates VALUES (2036, 3, '2036-03-01');
INSERT INTO structu_log.dates VALUES (2036, 4, '2036-04-01');
INSERT INTO structu_log.dates VALUES (2036, 5, '2036-05-01');
INSERT INTO structu_log.dates VALUES (2036, 6, '2036-06-01');
INSERT INTO structu_log.dates VALUES (2036, 7, '2036-07-01');
INSERT INTO structu_log.dates VALUES (2036, 8, '2036-08-01');
INSERT INTO structu_log.dates VALUES (2036, 9, '2036-09-01');
INSERT INTO structu_log.dates VALUES (2036, 10, '2036-10-01');
INSERT INTO structu_log.dates VALUES (2036, 11, '2036-11-01');
INSERT INTO structu_log.dates VALUES (2036, 12, '2036-12-01');
INSERT INTO structu_log.dates VALUES (2037, 1, '2037-01-01');
INSERT INTO structu_log.dates VALUES (2037, 2, '2037-02-01');
INSERT INTO structu_log.dates VALUES (2037, 3, '2037-03-01');
INSERT INTO structu_log.dates VALUES (2037, 4, '2037-04-01');
INSERT INTO structu_log.dates VALUES (2037, 5, '2037-05-01');
INSERT INTO structu_log.dates VALUES (2037, 6, '2037-06-01');
INSERT INTO structu_log.dates VALUES (2037, 7, '2037-07-01');
INSERT INTO structu_log.dates VALUES (2037, 8, '2037-08-01');
INSERT INTO structu_log.dates VALUES (2037, 9, '2037-09-01');
INSERT INTO structu_log.dates VALUES (2037, 10, '2037-10-01');
INSERT INTO structu_log.dates VALUES (2037, 11, '2037-11-01');
INSERT INTO structu_log.dates VALUES (2037, 12, '2037-12-01');
INSERT INTO structu_log.dates VALUES (2038, 1, '2038-01-01');
INSERT INTO structu_log.dates VALUES (2038, 2, '2038-02-01');
INSERT INTO structu_log.dates VALUES (2038, 3, '2038-03-01');
INSERT INTO structu_log.dates VALUES (2038, 4, '2038-04-01');
INSERT INTO structu_log.dates VALUES (2038, 5, '2038-05-01');
INSERT INTO structu_log.dates VALUES (2038, 6, '2038-06-01');
INSERT INTO structu_log.dates VALUES (2038, 7, '2038-07-01');
INSERT INTO structu_log.dates VALUES (2038, 8, '2038-08-01');
INSERT INTO structu_log.dates VALUES (2038, 9, '2038-09-01');
INSERT INTO structu_log.dates VALUES (2038, 10, '2038-10-01');
INSERT INTO structu_log.dates VALUES (2038, 11, '2038-11-01');
INSERT INTO structu_log.dates VALUES (2038, 12, '2038-12-01');
INSERT INTO structu_log.dates VALUES (2039, 1, '2039-01-01');
INSERT INTO structu_log.dates VALUES (2039, 2, '2039-02-01');
INSERT INTO structu_log.dates VALUES (2039, 3, '2039-03-01');
INSERT INTO structu_log.dates VALUES (2039, 4, '2039-04-01');
INSERT INTO structu_log.dates VALUES (2039, 5, '2039-05-01');
INSERT INTO structu_log.dates VALUES (2039, 6, '2039-06-01');
INSERT INTO structu_log.dates VALUES (2039, 7, '2039-07-01');
INSERT INTO structu_log.dates VALUES (2039, 8, '2039-08-01');
INSERT INTO structu_log.dates VALUES (2039, 9, '2039-09-01');
INSERT INTO structu_log.dates VALUES (2039, 10, '2039-10-01');
INSERT INTO structu_log.dates VALUES (2039, 11, '2039-11-01');
INSERT INTO structu_log.dates VALUES (2039, 12, '2039-12-01');
INSERT INTO structu_log.dates VALUES (2040, 1, '2040-01-01');
INSERT INTO structu_log.dates VALUES (2040, 2, '2040-02-01');
INSERT INTO structu_log.dates VALUES (2040, 3, '2040-03-01');
INSERT INTO structu_log.dates VALUES (2040, 4, '2040-04-01');
INSERT INTO structu_log.dates VALUES (2040, 5, '2040-05-01');
INSERT INTO structu_log.dates VALUES (2040, 6, '2040-06-01');
INSERT INTO structu_log.dates VALUES (2040, 7, '2040-07-01');
INSERT INTO structu_log.dates VALUES (2040, 8, '2040-08-01');
INSERT INTO structu_log.dates VALUES (2040, 9, '2040-09-01');
INSERT INTO structu_log.dates VALUES (2040, 10, '2040-10-01');
INSERT INTO structu_log.dates VALUES (2040, 11, '2040-11-01');
INSERT INTO structu_log.dates VALUES (2040, 12, '2040-12-01');
INSERT INTO structu_log.dates VALUES (2041, 1, '2041-01-01');
INSERT INTO structu_log.dates VALUES (2041, 2, '2041-02-01');
INSERT INTO structu_log.dates VALUES (2041, 3, '2041-03-01');
INSERT INTO structu_log.dates VALUES (2041, 4, '2041-04-01');
INSERT INTO structu_log.dates VALUES (2041, 5, '2041-05-01');
INSERT INTO structu_log.dates VALUES (2041, 6, '2041-06-01');
INSERT INTO structu_log.dates VALUES (2041, 7, '2041-07-01');
INSERT INTO structu_log.dates VALUES (2041, 8, '2041-08-01');
INSERT INTO structu_log.dates VALUES (2041, 9, '2041-09-01');
INSERT INTO structu_log.dates VALUES (2041, 10, '2041-10-01');
INSERT INTO structu_log.dates VALUES (2041, 11, '2041-11-01');
INSERT INTO structu_log.dates VALUES (2041, 12, '2041-12-01');
INSERT INTO structu_log.dates VALUES (2042, 1, '2042-01-01');
INSERT INTO structu_log.dates VALUES (2042, 2, '2042-02-01');
INSERT INTO structu_log.dates VALUES (2042, 3, '2042-03-01');
INSERT INTO structu_log.dates VALUES (2042, 4, '2042-04-01');
INSERT INTO structu_log.dates VALUES (2042, 5, '2042-05-01');
INSERT INTO structu_log.dates VALUES (2042, 6, '2042-06-01');
INSERT INTO structu_log.dates VALUES (2042, 7, '2042-07-01');
INSERT INTO structu_log.dates VALUES (2042, 8, '2042-08-01');
INSERT INTO structu_log.dates VALUES (2042, 9, '2042-09-01');
INSERT INTO structu_log.dates VALUES (2042, 10, '2042-10-01');
INSERT INTO structu_log.dates VALUES (2042, 11, '2042-11-01');
INSERT INTO structu_log.dates VALUES (2042, 12, '2042-12-01');
INSERT INTO structu_log.dates VALUES (2043, 1, '2043-01-01');
INSERT INTO structu_log.dates VALUES (2043, 2, '2043-02-01');
INSERT INTO structu_log.dates VALUES (2043, 3, '2043-03-01');
INSERT INTO structu_log.dates VALUES (2043, 4, '2043-04-01');
INSERT INTO structu_log.dates VALUES (2043, 5, '2043-05-01');
INSERT INTO structu_log.dates VALUES (2043, 6, '2043-06-01');
INSERT INTO structu_log.dates VALUES (2043, 7, '2043-07-01');
INSERT INTO structu_log.dates VALUES (2043, 8, '2043-08-01');
INSERT INTO structu_log.dates VALUES (2043, 9, '2043-09-01');
INSERT INTO structu_log.dates VALUES (2043, 10, '2043-10-01');
INSERT INTO structu_log.dates VALUES (2043, 11, '2043-11-01');
INSERT INTO structu_log.dates VALUES (2043, 12, '2043-12-01');
INSERT INTO structu_log.dates VALUES (2044, 1, '2044-01-01');
INSERT INTO structu_log.dates VALUES (2044, 2, '2044-02-01');
INSERT INTO structu_log.dates VALUES (2044, 3, '2044-03-01');
INSERT INTO structu_log.dates VALUES (2044, 4, '2044-04-01');
INSERT INTO structu_log.dates VALUES (2044, 5, '2044-05-01');
INSERT INTO structu_log.dates VALUES (2044, 6, '2044-06-01');
INSERT INTO structu_log.dates VALUES (2044, 7, '2044-07-01');
INSERT INTO structu_log.dates VALUES (2044, 8, '2044-08-01');
INSERT INTO structu_log.dates VALUES (2044, 9, '2044-09-01');
INSERT INTO structu_log.dates VALUES (2044, 10, '2044-10-01');
INSERT INTO structu_log.dates VALUES (2044, 11, '2044-11-01');
INSERT INTO structu_log.dates VALUES (2044, 12, '2044-12-01');
INSERT INTO structu_log.dates VALUES (2045, 1, '2045-01-01');
INSERT INTO structu_log.dates VALUES (2045, 2, '2045-02-01');
INSERT INTO structu_log.dates VALUES (2045, 3, '2045-03-01');
INSERT INTO structu_log.dates VALUES (2045, 4, '2045-04-01');
INSERT INTO structu_log.dates VALUES (2045, 5, '2045-05-01');
INSERT INTO structu_log.dates VALUES (2045, 6, '2045-06-01');
INSERT INTO structu_log.dates VALUES (2045, 7, '2045-07-01');
INSERT INTO structu_log.dates VALUES (2045, 8, '2045-08-01');
INSERT INTO structu_log.dates VALUES (2045, 9, '2045-09-01');
INSERT INTO structu_log.dates VALUES (2045, 10, '2045-10-01');
INSERT INTO structu_log.dates VALUES (2045, 11, '2045-11-01');
INSERT INTO structu_log.dates VALUES (2045, 12, '2045-12-01');
INSERT INTO structu_log.dates VALUES (2046, 1, '2046-01-01');
INSERT INTO structu_log.dates VALUES (2046, 2, '2046-02-01');
INSERT INTO structu_log.dates VALUES (2046, 3, '2046-03-01');
INSERT INTO structu_log.dates VALUES (2046, 4, '2046-04-01');
INSERT INTO structu_log.dates VALUES (2046, 5, '2046-05-01');
INSERT INTO structu_log.dates VALUES (2046, 6, '2046-06-01');
INSERT INTO structu_log.dates VALUES (2046, 7, '2046-07-01');
INSERT INTO structu_log.dates VALUES (2046, 8, '2046-08-01');
INSERT INTO structu_log.dates VALUES (2046, 9, '2046-09-01');
INSERT INTO structu_log.dates VALUES (2046, 10, '2046-10-01');
INSERT INTO structu_log.dates VALUES (2046, 11, '2046-11-01');
INSERT INTO structu_log.dates VALUES (2046, 12, '2046-12-01');
INSERT INTO structu_log.dates VALUES (2047, 1, '2047-01-01');
INSERT INTO structu_log.dates VALUES (2047, 2, '2047-02-01');
INSERT INTO structu_log.dates VALUES (2047, 3, '2047-03-01');
INSERT INTO structu_log.dates VALUES (2047, 4, '2047-04-01');
INSERT INTO structu_log.dates VALUES (2047, 5, '2047-05-01');
INSERT INTO structu_log.dates VALUES (2047, 6, '2047-06-01');
INSERT INTO structu_log.dates VALUES (2047, 7, '2047-07-01');
INSERT INTO structu_log.dates VALUES (2047, 8, '2047-08-01');
INSERT INTO structu_log.dates VALUES (2047, 9, '2047-09-01');
INSERT INTO structu_log.dates VALUES (2047, 10, '2047-10-01');
INSERT INTO structu_log.dates VALUES (2047, 11, '2047-11-01');
INSERT INTO structu_log.dates VALUES (2047, 12, '2047-12-01');
INSERT INTO structu_log.dates VALUES (2048, 1, '2048-01-01');
INSERT INTO structu_log.dates VALUES (2048, 2, '2048-02-01');
INSERT INTO structu_log.dates VALUES (2048, 3, '2048-03-01');
INSERT INTO structu_log.dates VALUES (2048, 4, '2048-04-01');
INSERT INTO structu_log.dates VALUES (2048, 5, '2048-05-01');
INSERT INTO structu_log.dates VALUES (2048, 6, '2048-06-01');
INSERT INTO structu_log.dates VALUES (2048, 7, '2048-07-01');
INSERT INTO structu_log.dates VALUES (2048, 8, '2048-08-01');
INSERT INTO structu_log.dates VALUES (2048, 9, '2048-09-01');
INSERT INTO structu_log.dates VALUES (2048, 10, '2048-10-01');
INSERT INTO structu_log.dates VALUES (2048, 11, '2048-11-01');
INSERT INTO structu_log.dates VALUES (2048, 12, '2048-12-01');
INSERT INTO structu_log.dates VALUES (2049, 1, '2049-01-01');
INSERT INTO structu_log.dates VALUES (2049, 2, '2049-02-01');
INSERT INTO structu_log.dates VALUES (2049, 3, '2049-03-01');
INSERT INTO structu_log.dates VALUES (2049, 4, '2049-04-01');
INSERT INTO structu_log.dates VALUES (2049, 5, '2049-05-01');
INSERT INTO structu_log.dates VALUES (2049, 6, '2049-06-01');
INSERT INTO structu_log.dates VALUES (2049, 7, '2049-07-01');
INSERT INTO structu_log.dates VALUES (2049, 8, '2049-08-01');
INSERT INTO structu_log.dates VALUES (2049, 9, '2049-09-01');
INSERT INTO structu_log.dates VALUES (2049, 10, '2049-10-01');
INSERT INTO structu_log.dates VALUES (2049, 11, '2049-11-01');
INSERT INTO structu_log.dates VALUES (2049, 12, '2049-12-01');
INSERT INTO structu_log.dates VALUES (2050, 1, '2050-01-01');
INSERT INTO structu_log.dates VALUES (2050, 2, '2050-02-01');
INSERT INTO structu_log.dates VALUES (2050, 3, '2050-03-01');
INSERT INTO structu_log.dates VALUES (2050, 4, '2050-04-01');
INSERT INTO structu_log.dates VALUES (2050, 5, '2050-05-01');
INSERT INTO structu_log.dates VALUES (2050, 6, '2050-06-01');
INSERT INTO structu_log.dates VALUES (2050, 7, '2050-07-01');
INSERT INTO structu_log.dates VALUES (2050, 8, '2050-08-01');
INSERT INTO structu_log.dates VALUES (2050, 9, '2050-09-01');
INSERT INTO structu_log.dates VALUES (2050, 10, '2050-10-01');
INSERT INTO structu_log.dates VALUES (2050, 11, '2050-11-01');
INSERT INTO structu_log.dates VALUES (2050, 12, '2050-12-01');

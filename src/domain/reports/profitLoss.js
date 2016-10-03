

function(startDate, endDate) {
  const incomeQuery = `
  SELECT
    inc.type as accountName,
    mgl.acctGL as accountCode,
    'income' as accountType,
    mgl.type as accountGroup,
    SUM(il.amount) as accountBalance
  FROM structu{$dev}_income.iLedger il
    LEFT JOIN structu{$dev}_income.income inc on il.incomeID = inc.incomeID
    LEFT JOIN structu{$dev}_log.mapGL mgl on mgl.mapID = inc.mapID
    LEFT JOIN structu{$dev}_assets.lease lse on lse.leaseID = il.leaseID
    LEFT JOIN structu{$dev}_assets.unit u on u.unitID = lse.unitID
    LEFT JOIN structu{$dev}_assets.location loc on loc.locationID = u.locationID
    LEFT JOIN structu{$dev}_assets.deed d on d.locationID = loc.locationID
      and il.dateStamp BETWEEN d.startDate AND COALESCE(d.endDate, '${endDate}')
      and d.ownerID = COALESCE(il.accountID, loc.ownerID)
  WHERE
    COALESCE(il.accountID, loc.ownerID) = '$ownerID'
    AND il.dateStamp BETWEEN '${startDate}' AND '${endDate}'
    AND (loc.locationID is NULL OR il.dateStamp >=d.startDate)
    AND il.incomeID IS NOT NULL
  GROUP BY
    inc.type, mgl.acctGL, mgl.type`;

$expenseQuery = `
  SELECT
    exp.type as accountName,
    mgl.acctGL as accountCode,
    'expense' as accountType,
    mgl.type as accountGroup,
    SUM(el.payment) as accountBalance
  FROM structu{$dev}_expenses.eLedger el
    LEFT JOIN structu{$dev}_expenses.recurring r ON el.recurringID = r.recurringID
    LEFT JOIN structu{$dev}_assets.location loc ON loc.locationID=COALESCE(el.locationID,r.locationID)
    LEFT JOIN structu{$dev}_expenses.vendor v on v.vendorID=COALESCE(el.vendorID, r.vendorID)
    LEFT JOIN structu{$dev}_assets.deed d on d.locationID = loc.locationID
      and el.dateStamp BETWEEN d.startDate AND COALESCE(d.endDate, '${endDate}')
      and d.ownerID = COALESCE(el.ownerID, r.ownerID)
    LEFT JOIN structu{$dev}_expenses.expense exp on COALESCE(el.expenseID, r.expenseID, v.expenseID) = exp.expenseID
    LEFT JOIN structu{$dev}_log.mapGL mgl on mgl.mapID = exp.mapID
  WHERE
    COALESCE(d.ownerID, el.ownerID, r.ownerID) = '$ownerID'
    AND (
      (el.dateStamp BETWEEN '${startDate}' AND '${endDate}')
      AND (loc.locationID IS NULL OR el.dateStamp >= d.startDate)
      OR (el.dateStamp IS NULL AND el.createDate BETWEEN '${startDate}' AND '${endDate}')
    )
  GROUP BY
    exp.type, mgl.acctGL, mgl.type`;

$fullQuery = "SELECT *
  FROM (
    ($incomeQuery)
    UNION ALL
    ($expenseQuery)
  ) as entries
  ORDER BY
    accountType, accountGroup, accountCode";

$results = mysql_query($fullQuery);
$entries = array();
if (mysql_error()) {
  throw new Exception(mysql_error(), 1);
}
while($row = mysql_fetch_assoc($results)) {
  $row['accountBalance'] = floatval($row['accountBalance']);
  $entries[] = $row;
}
}

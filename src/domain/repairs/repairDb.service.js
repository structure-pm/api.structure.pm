import * as db from '../../db';


function SQL (template, ...expressions) {
  return template.reduce((accumulator, part, i) => {
    return accumulator + expressions[i - 1] + part
  })
}


export function search(query, options) {
  const tablePage = `${db.getPrefix()}_log.page`;
  const tableEntry = `${db.getPrefix()}_log.entry`;
  const tableAuth = `${db.getPrefix()}_httpauth.user_auth`;
  const tableLease = `${db.getPrefix()}_assets.lease`;
  const tableUnit = `${db.getPrefix()}_assets.unit`;
  const tableLocation = `${db.getPrefix()}_assets.location`;
  const tableOwner = `${db.getPrefix()}_assets.owner`;
  const tableInvoicePages = `${db.getPrefix()}_income.invoices_pages`;


  const defaultOptions = {
    limit: 50,
    offset: 0,
    sortDir: 'DESC'
  }
  const {limit, offset, sortDir} = Object.assign({}, defaultOptions, options);

  const whereClauses = [];

  if (!query.includeComplete) whereClauses.push(`last.status < 5`);
  if (query.accountID) whereClauses.push(`own.ownerID=${db.escape(query.accountID)}`);
  if (query.managerID) whereClauses.push(`own.managedBy=${db.escape(query.managerID)}`);
  if (query.startDate) whereClauses.push(`(last.status != 5 OR DATE_FORMAT(last.timeStamp,'%Y-%m-%d') >= '${query.startDate}')`);
  if (query.endDate) whereClauses.push(`DATE_FORMAT(first.timeStamp,'%Y-%m-%d') <= '${query.endDate}'`);
  if (query.repairType) whereClauses.push(`page.repairType='${query.repairType}'`);
  if (query.priority) whereClauses.push(`last.priority='${query.priority}'`);
  if (query.zoneID) whereClauses.push(`loc.zoneID='${query.zoneID}'`);
  const whereClause = whereClauses.join(' AND ');


  const sql = SQL`SELECT
			page.pageID,
			page.pageID as JobID,
			page.parentPageID as parentJobID,
			page.open,
			page.title,
			page.pageType,
			page.repairType,
			page.invoice,
			page.openEntry,
			page.lastEntry,
			page.billed,
			page.labor,
			page.billComment,
			first.userName AS openUser,
			first.entry AS firstEntry,
			DATE_FORMAT(first.timeStamp,'%Y-%m-%d') as dateEntered,
		  IF(last.status = 5,
		    DATE_FORMAT(last.timeStamp,'%Y-%m-%d'),
		    NULL) as dateClosed,
			COALESCE(page.groupID, loc.groupID, page.locationID, u.locationID, 'General') as groupLoc,
			last.userName,
			last.forUser,
			CONCAT(auth.firstName, ' ', auth.lastName) as assignedUsername,
			last.priority,
			last.status,
			last.timeStamp,
			COALESCE(page.ownerID, loc.ownerID, grp.ownerID) as ownerID,
			own.managedBy as managerID,
			own.nickname as ownerName,
			INSTR(own.nickname, 'DNM') <= 0 as ownerCurrentlyManaged,
			INSTR(loc.shortHand, 'DNM') <= 0 as locationCurrentlyManaged,
			loc.locationID,
			COALESCE(loc.shortHand, loc.locationID) as locationName,
			loc.offsiteRepair as offsite,
			loc.zoneID,
			CONCAT_WS(' ', COALESCE(loc.streetNum, u.streetNum), loc.street, loc.city, loc.state, loc.zip) as address,
			u.unitID,
			COALESCE(u.suiteNum, u.streetNum) as suiteNum,
			page.unitID as recordedUnitID
		FROM
			${tablePage} as page
			LEFT JOIN ${tableEntry} as first on first.entryID = page.openEntry
			LEFT JOIN ${tableEntry} as last on last.entryID = page.lastEntry
			LEFT JOIN ${tableAuth} as auth on auth.username=last.forUser
			LEFT JOIN ${tableLease} lse
		    on lse.tenantID = page.tenantID
		    and lse.startDate <= first.timeStamp
		    and lse.endDate >= first.timeStamp
		  LEFT JOIN ${tableUnit} u on COALESCE(page.unitID, lse.unitID) = u.unitID
		  LEFT JOIN ${tableLocation} loc on COALESCE(page.locationID, u.locationID) = loc.locationID
		  LEFT JOIN ${tableInvoicePages} inv on inv.pageID = page.pageID
			LEFT JOIN (SELECT DISTINCT groupID, ownerID FROM ${tableLocation} WHERE groupID IS NOT NULL) as grp on page.groupID = grp.groupID
			LEFT JOIN ${tableOwner} own on own.ownerID = COALESCE(page.ownerID, loc.ownerID, grp.ownerID)
    WHERE ${whereClause}
    ORDER BY DATE_FORMAT(first.timeStamp,'%Y-%m-%d') ${sortDir}
    LIMIT ${limit}
    OFFSET ${offset}
    `;

  return db.query(sql);
}

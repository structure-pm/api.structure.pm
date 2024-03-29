import * as db from '../../db';
import moment from 'moment';
import isNil from 'lodash/isNil';


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
  const tableZone = `${db.getPrefix()}_assets.zone`;
  const tableOwner = `${db.getPrefix()}_assets.owner`;
  const tableInvoicePages = `${db.getPrefix()}_income.invoices_pages`;

  query.active = Number(query.active);

  const defaultOptions = {
    limit: 50,
    offset: 0,
    sortDir: 'DESC'
  }
  const {limit, offset, sortDir} = Object.assign({}, defaultOptions, options);

  const whereClauses = [
    'own.active = 1',
    `page.pageType = 'repair'`,
    `(own.nickname IS NULL OR own.nickname NOT LIKE '%DNM%')`,
  ];

  if (query.accountID) whereClauses.push(`own.ownerID=${db.escape(query.accountID)}`);
  if (query.managerID) whereClauses.push(`own.managedBy=${db.escape(query.managerID)}`);
  if (query.startDate) whereClauses.push(`(last.status != 5 OR DATE_FORMAT(last.timeStamp,'%Y-%m-%d') >= '${query.startDate}')`);
  if (query.endDate) whereClauses.push(`DATE_FORMAT(first.timeStamp,'%Y-%m-%d') <= '${query.endDate}'`);
  if (query.repairType) whereClauses.push(`page.repairType='${query.repairType}'`);
  if (query.priority) whereClauses.push(`last.priority='${query.priority}'`);
  if (query.assignedTo) whereClauses.push(`last.forUser=${db.escape(query.assignedTo)}`);
  if (query.billed) {
    if (query.billed === "-1") {
      whereClauses.push(`page.billed IS NULL`)
    } else {
      whereClauses.push(`page.billed=${db.escape(Number(query.billed))}`)
    }
  }
  if (query.zoneID) {
    if (Number(query.zoneID) < 0) {
      whereClauses.push(`loc.zoneID IS NULL`);
    } else {
      whereClauses.push(`loc.zoneID=${db.escape(Number(query.zoneID))}`);
    }
  }
  if (query.active>=0) {
    whereClauses.push ((query.active === 0) ? `last.status = 5` : 'last.status != 5');
  }
  if (query.search && query.search.length) {
    const search = [
      `page.pageID like '%${query.search}%'`,
      `page.title like '%${query.search}%'`,
      `own.nickname like '%${query.search}%'`,
      `COALESCE(loc.shortHand, loc.locationID) like '%${query.search}%'`,
      `CONCAT_WS(' ', COALESCE(loc.streetNum, u.streetNum), loc.street, loc.city, loc.state, loc.zip) like '%${query.search}%'`,
    ].join(' OR ');
    whereClauses.push(`(${search})`);
  }

  const whereClause = whereClauses.join(' AND ');

  const sql = SQL`SELECT SQL_CALC_FOUND_ROWS
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
      zone.name as zoneName,
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
		  LEFT JOIN ${tableZone} zone on zone.zoneID = loc.zoneID
		  LEFT JOIN ${tableInvoicePages} inv on inv.pageID = page.pageID
			LEFT JOIN (SELECT DISTINCT groupID, ownerID FROM ${tableLocation} WHERE groupID IS NOT NULL) as grp on page.groupID = grp.groupID
			LEFT JOIN ${tableOwner} own on own.ownerID = COALESCE(page.ownerID, loc.ownerID, grp.ownerID)
    WHERE ${whereClause}
    ORDER BY DATE_FORMAT(first.timeStamp,'%Y-%m-%d') ${sortDir}
    `;

    const limitClause = `LIMIT ${limit} OFFSET ${offset}`;

  return Promise.all([
    db.query(`${sql} ${limitClause}`),
    db.query(sql),
  ])
    .then(([rows, noLimit]) => [rows, noLimit.length])
    .then(([rows, totalRows]) => {
      // const totalRows = (rows && rows.length) ? rows[0].full_count : 0;
      return {
        total_rows: totalRows,
        count: rows.length,
        offset: offset,
        data: rows
      }
    })
}



export function getRepairTypes() {
  const tablePage = `${db.getPrefix()}_log.page`;
  const sql = `SELECT DISTINCT repairType
    FROM ${tablePage}
    ORDER BY repairType`;

  return db.query(sql);
}

export function getMaintenanceZones(managerID) {
  const tableZone = `${db.getPrefix()}_assets.zone`;

  return Promise.resolve()
    .then(() => {
      if (!managerID) {
        throw new Error(`getMaintenanceZones() is missing 'managerID'`)
      }

      const sql = `SELECT *
        FROM ${tableZone}
        WHERE managerID = ${db.escape(managerID)}`;

      return db.query(sql);
    })

}

export function getMaintenanceStaff(managerID) {
  const tableUser = `${db.getPrefix()}_httpauth.user_auth`;
  const tableAccess = `${db.getPrefix()}_httpauth.user_access`;

  return Promise.resolve()
    .then(() => {
      if (!managerID) {
        throw new Error(`getMaintenanceZones() is missing 'managerID'`)
      }


      const sql = `SELECT
      		user.username,
      		user.firstName,
      		user.lastname
      	FROM ${tableUser} user
      		JOIN ${tableAccess} acc on user.username = acc.username
      	WHERE
      		acc.accountID=${db.escape(managerID)}
      	ORDER BY
      		user.firstName, user.lastName`;

      return db.query(sql);
    })
}

export function getEntriesForRepair(repairId) {
  const tableEntries = `${db.getPrefix()}_log.entry`;
  const tableUser = `${db.getPrefix()}_httpauth.user_auth`;


  if (!isFinite(Number(repairId))) return Promise.reject(new Error(`Unrecognized repairId. received '${repairId}'`));

  const sql = `SELECT
      ent.*,
      CONCAT_WS(' ', user.firstName, user.lastname) as fullName
    FROM ${tableEntries} ent
      LEFT JOIN ${tableUser} user on user.username = ent.userName
    WHERE ent.pageID=${db.escape(Number(repairId))}
    ORDER BY ent.timeStamp ASC
  `;

  return db.query(sql);
}

export function createRepairEntry(entryData) {
	const entryTable = `${db.getPrefix()}_log.entry`;
  const pageTable = `${db.getPrefix()}_log.page`;

  const sql = `INSERT INTO ${entryTable} (
    pageId, userName, forUser, entry, timeStamp, startDate, endDate,
  	priority, status, taskStart, taskEnd
  ) VALUES (
    ${db.escape(entryData.repairId)},
    ${db.escape(entryData.user)},
    ${db.escape(entryData.forUser)},
    ${db.escape(entryData.entry)},
    ${db.escape(moment().format())},
    ${db.escape(entryData.startDate)},
    ${db.escape(entryData.endDate)},
    ${db.escape(entryData.priority)},
    ${db.escape(entryData.status)},
    ${db.escape(entryData.taskStart)},
    ${db.escape(entryData.taskEnd)}
  )`;

  return db.query(sql)
    .then(res => {
      const sql = `UPDATE ${pageTable} SET lastEntry = ${res.insertId} WHERE pageID=${entryData.repairId}`;
      return db.query(sql);
    })
}

import * as db from '../../../db';

export default function TenantsOwing(parameters) {
  const {minBalance, ownerIDs=[]} = parameters;
  const inOwnerIDs = ownerIDs.map(oid => `'${oid}'`).join(',');
  const dbPrefix = db.getPrefix();


  let whereClause = []

  whereClause.push(`i.tenantID IS NOT NULL`);
  whereClause.push(`t.rentBalance + t.feeBalance >= ${minBalance}`);
  if (!ownerIDs || !ownerIDs.length) {
    whereClause.push(`o.managedBy='alltrade'`);
  } else {
    whereClause.push(`o.ownerID in (${inOwnerIDs})`)
  }
  whereClause = whereClause.join(' AND ');


  const sql = `

  	SELECT i.tenantID,
  		t.firstName,
  		t.lastName,
  		CONCAT(IFNULL(u.streetNum,''),' ',(SELECT street FROM ${dbPrefix}_assets.location WHERE location.locationID = u.locationID),IF(suiteNum,CONCAT(' #',suiteNum),'')) address,
  		t.email,
  		t.phone,
  		t.altPhone,
  		(t.rentBalance + t.feeBalance) balance,
  		IFNULL(o.nickname,o.lName) owner,
  		l.startDate,
  		IF(l.agreement='MTM','~',l.endDate) endDate,
  		l.rent,
  		(IFNULL(l.wireless,0) + IFNULL(l.petRent,0) + IFNULL(l.otherCharge1,0) + IFNULL(l.otherCharge2,0)) lFees,
  		l.deposit

  	FROM ${dbPrefix}_assets.indexes i
  		LEFT JOIN ${dbPrefix}_assets.tenant t ON i.tenantID = t.tenantID
  		LEFT JOIN ${dbPrefix}_assets.lease l ON i.leaseID = l.leaseID
  		LEFT JOIN ${dbPrefix}_assets.unit u ON i.unitID = u.unitID
  		LEFT JOIN ${dbPrefix}_assets.owner o ON i.ownerID = o.ownerID

  	WHERE
      ${whereClause}`;

  return db.query(sql).then(table => {
    return {
      data: table,
      count: table.length
    }
  });
}

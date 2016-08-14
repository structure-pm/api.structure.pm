import * as db from '../../db';


const Owner = {
  find(where={}, options={}) {
    const ownerTable = `${db.getPrefix()}_assets.owner`;
    const whereClauses = Object.keys(where)
      .map(key => `${key}=?`)
      .concat("o.nickname NOT LIKE '%DNM%'");
    const values = Object.keys(where).map(key => where[key]);
    const whereClause = (whereClauses.length) ? 'WHERE ' + whereClauses.join(' AND ') : '';


    const query = `
      SELECT
        *,
        COALESCE(o.nickname, o.lName, o.ownerID) as ownerName
      FROM ${ownerTable} o
      ${whereClause}
      ORDER BY COALESCE(o.nickname, o.lName, o.ownerID)`;
    return db.query(query, values);
  }
}

export default function createOwnerRepository() {
  let repo = Object.create(Owner);
  return repo;
}

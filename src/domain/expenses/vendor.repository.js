import * as db from '../../db';


const Vendor = {
  findById(vendorID) {
    const vendorTable = `${db.getPrefix()}_expenses.vendor`;
    const contactTable = `${db.getPrefix()}_assets.contacts`;
    const query = `
      SELECT
        v.vendorID,
        v.contactID,
        v.expenseID,
        c.accountID,
        c.cName,
        c.lName,
        c.fName,
        c.phone,
        c.altPhone,
        c.address,
        c.citystate,
        c.email,
        c.web,
        c.rate,
        c.logNotify,
        c.active,
        c.comment
      FROM ${vendorTable} v
        LEFT JOIN ${contactTable} c on c.contactID = v.contactID
      WHERE v.vendorID=?`;
    return db.query(query, [vendorID])
      .spread((rows, meta) => (rows.length) ? rows[0] : null )
  }
};

export default function craeteVendor() {
  let repo = Object.create(Vendor);
  return repo;
}


/**
 * {
 *   "CustomerName": "Joshua Lyndley",
 *   "CustomerNumber": null,
 *   "CreditorName": "Time Warner Cable",
 *   "CreditorNumber": null,
 *   "AccountNumber": "10303-918592701-8001",
 *   "InvoiceNumber": null,
 *   "CurrentAmount": 60.96,
 *   "PastDueOrOtherCharges": 53.46,
 *   "TotalAmount": 114.42,
 *   "DueDate": "04/23/2016",
 *   "Result": 0
 * }
 */
const requiredFields = ['CreditorNumber', 'AccountNumber', 'CurrentAmount', 'TotalAmount', 'DueDate', ];

export default function BillScan(scanData) {
  let missingFields = requiredFields.reduce((missing, field) => {
    return (!scanData.hasOwnProperty(field) || !scanData[field])
      ? missing.concat(field)
      : missing;
  }, []);

  if (missingFields.length) {
    throw new Error(`Missing expected fields in scaned data: [${missingFields.join(', ')}]`)
  }

  Object.assign(this, scanData);

}

BillScan.requiredFields = requiredFields;

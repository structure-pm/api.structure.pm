export function validateRequiredFields(obj, requiredFields, requester) {
  const missing = requiredFields.filter(fld => !obj.hasOwnProperty(fld));
  if (missing.length) {
    const lead = (requester) ? `${requester} is missing` : 'Missing';
    throw new Error(`${lead} the following missing fields: [${missing.join(',')}]`);
  }
}

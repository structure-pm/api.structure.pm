export function validateRequiredFields(obj, requiredFields, requester) {
  const missing = requiredFields.filter(fld => !obj.hasOwnProperty(fld));
  if (missing.length) {
    const lead = (requester) ? `${requester} is missing` : 'Missing';
    throw new Error(`${lead} the following missing fields: [${missing.join(',')}]`);
  }
}


export function isValidEmail(email) {
  const emailRE = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
  return emailRE.test(email);
}

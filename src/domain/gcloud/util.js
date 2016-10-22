export function minutesFromNow(m) {
  const dNow = new Date();
  let fromNow = new Date(dNow.getTime() + m*60000);
  return fromNow
}

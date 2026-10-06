export const GENDERS = ['Male', 'Female', 'Other'];
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Today's date at the hospital (India), as YYYY-MM-DD, whatever the server's timezone. */
export function todayInIndia() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
}

export function isIsoDate(value) {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false;
  const d = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const text = (v) => (typeof v === 'string' ? v.trim() : '');

/** Returns { data } with cleaned values, or { errors } keyed by field name. */
export function validatePatient(body = {}) {
  const data = {
    visitDate: text(body.visitDate),
    gender: text(body.gender),
    patientName: text(body.patientName).replace(/\s+/g, ' '),
    mobile: text(body.mobile).replace(/\D/g, ''),
    address: text(body.address),
    remarks: text(body.remarks),
  };

  const errors = {};
  if (!isIsoDate(data.visitDate)) errors.visitDate = 'Choose the visit date.';
  else if (data.visitDate > todayInIndia()) errors.visitDate = 'The visit date can’t be in the future.';
  if (!GENDERS.includes(data.gender)) errors.gender = 'Choose a gender.';
  if (data.patientName.length < 2 || data.patientName.length > 120) errors.patientName = 'Enter the patient’s full name.';
  if (!/^[6-9]\d{9}$/.test(data.mobile)) errors.mobile = 'Enter a 10-digit mobile number starting with 6, 7, 8 or 9.';
  if (data.address.length < 5 || data.address.length > 300) errors.address = 'Enter the address, at least the area and city.';
  if (data.remarks.length > 500) errors.remarks = 'Keep remarks under 500 characters.';

  return Object.keys(errors).length ? { errors } : { data };
}

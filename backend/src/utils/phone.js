/**
 * Normalize a Kenyan phone number to 2547XXXXXXXXX format.
 * Handles: 07XX, 2547XX, +2547XX, 7XX (10-digit)
 */
const normalizePhone = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');

  if (digits.startsWith('2547') && digits.length === 12) return digits;
  if (digits.startsWith('2541') && digits.length === 12) return digits;
  if (digits.startsWith('254') && digits.length === 12) return digits;
  if (digits.startsWith('07') && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.startsWith('01') && digits.length === 10) return `254${digits.slice(1)}`;
  if (digits.startsWith('7') && digits.length === 9) return `254${digits}`;
  if (digits.startsWith('1') && digits.length === 9) return `254${digits}`;

  return null;
};

const isValidKenyanPhone = (phone) => {
  const normalized = normalizePhone(phone);
  return normalized !== null && /^254[0-9]{9}$/.test(normalized);
};

module.exports = { normalizePhone, isValidKenyanPhone };

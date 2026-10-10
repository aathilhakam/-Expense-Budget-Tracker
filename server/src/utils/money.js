export function toMinorUnits(value) {
  const amount = Number(value);
  if (!Number.isFinite(amount)) {
    throw new TypeError('Amount must be a finite number.');
  }
  return Math.round((amount + Number.EPSILON) * 100);
}

export function fromMinorUnits(value) {
  return Number(value || 0) / 100;
}

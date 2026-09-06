export function normalizeLocalPhone(value: string): string {
  return value.replace(/\D/g, '').replace(/^0+/, '');
}

export function isValidLocalPhone(countryIso: string, value: string): boolean {
  const digits = value.replace(/\D/g, '');

  return countryIso !== 'EG' || /^01[0125]\d{8}$/.test(digits);
}

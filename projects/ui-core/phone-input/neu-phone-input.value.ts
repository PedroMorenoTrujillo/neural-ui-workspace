import parsePhoneNumber, { type CountryCode } from 'libphonenumber-js/max';

export type NeuPhoneRegion = CountryCode;

/** Retains an incomplete edit alongside the E.164 representation of a valid number. */
export interface NeuPhoneInputValue {
  readonly region: NeuPhoneRegion;
  readonly raw: string;
  readonly e164: string | null;
}

/** Parses the whole entry using international metadata. Extensions require a separate field. */
export function createNeuPhoneInputValue(
  raw: string,
  region: NeuPhoneRegion,
): NeuPhoneInputValue | null {
  if (!raw.trim()) return null;
  const parsed = parsePhoneNumber(raw, { defaultCountry: region, extract: false });
  if (!parsed || parsed.ext || !parsed.isValid()) return { region, raw, e164: null };
  return { region: parsed.country ?? region, raw, e164: parsed.number };
}

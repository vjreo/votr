/**
 * City or town label for "Your districts".
 * Charlotte city limits come from the TIGER polygon.
 * Other towns are ZIP-based (USPS / county ZIP areas), not town-limit polygons.
 */

const ZIP_TOWN: Record<string, string> = {
  '28031': 'Cornelius',
  '28036': 'Davidson',
  '28078': 'Huntersville',
  '28105': 'Matthews',
  '28134': 'Pineville',
};

export const UNINCORPORATED = 'Unincorporated Mecklenburg';

export function zipFromAddress(address: string): string | undefined {
  const matches = [...address.toUpperCase().matchAll(/\b(\d{5})(?:-\d{4})?\b/g)];
  if (!matches.length) return undefined;
  const last = matches[matches.length - 1];
  if (last.index === 0 && address.slice(last[0].length).trim() === '') {
    return last[1];
  }
  if (last.index === 0) return undefined;
  return last[1];
}

export function placeName(opts: {
  isCharlotte: boolean;
  zip?: string | null;
  address?: string;
}): string {
  if (opts.isCharlotte) return 'Charlotte';
  const zip = opts.zip || (opts.address ? zipFromAddress(opts.address) : undefined);
  if (zip && ZIP_TOWN[zip]) return ZIP_TOWN[zip];
  return UNINCORPORATED;
}

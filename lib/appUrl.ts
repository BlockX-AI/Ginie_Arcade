/**
 * Resolve the public base URL used inside NFT metadata.
 *
 * NFT metadata is immutable once minted, so this must point at a stable public host.
 * Never returns a trailing slash.
 */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL || 'https://giniearcade2.vercel.app';
  return raw.replace(/\/+$/, '');
}

/**
 * True when the configured app URL points at a local dev host.
 *
 * Minting with a localhost metadata URI produces a permanently broken NFT: the URI is
 * written into the immutable Metaplex metadata account and can never be fixed, so
 * nobody outside this machine will ever resolve the image or name.
 */
export function isLocalAppUrl(url: string = getAppUrl()): boolean {
  try {
    const { hostname } = new URL(url);
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '[::1]' ||
      hostname.endsWith('.local')
    );
  } catch {
    return true; // unparseable means unusable
  }
}

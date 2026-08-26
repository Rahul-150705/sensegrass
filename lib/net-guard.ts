// Server-only SSRF guard — DO NOT import from client components
import dns from 'dns';
import net from 'net';

// Returns true if the given IPv4/IPv6 address is loopback, private, link-local,
// multicast, or otherwise non-routable (i.e. not a legitimate public target).
export function isDisallowedIp(ip: string): boolean {
  const family = net.isIP(ip);
  if (family === 4) {
    const parts = ip.split('.').map(Number);
    const [a, b] = parts;
    if (a === 127) return true; // loopback
    if (a === 10) return true; // private
    if (a === 172 && b >= 16 && b <= 31) return true; // private
    if (a === 192 && b === 168) return true; // private
    if (a === 169 && b === 254) return true; // link-local incl. cloud metadata
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
    if (a === 0) return true; // "this" network
    if (a >= 224) return true; // multicast / reserved
    return false;
  }
  if (family === 6) {
    const lower = ip.toLowerCase();
    if (lower === '::1' || lower === '::') return true; // loopback / unspecified
    if (lower.startsWith('fe80:')) return true; // link-local
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true; // unique local
    // IPv4-mapped IPv6 (::ffff:a.b.c.d) — check the embedded IPv4 address
    const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isDisallowedIp(mapped[1]);
    return false;
  }
  return true; // unrecognized format — reject
}

// Resolves a hostname and throws if it (or any of its resolved addresses)
// points at a private/internal/loopback network. Mitigates SSRF via
// user-supplied URLs that scrape or fetch server-side.
export async function assertPublicHostname(hostname: string): Promise<void> {
  const bareHost = hostname.toLowerCase();
  if (bareHost === 'localhost' || bareHost.endsWith('.localhost')) {
    throw new Error('Requests to localhost are not allowed.');
  }

  // If the hostname is already a literal IP, check it directly.
  if (net.isIP(bareHost)) {
    if (isDisallowedIp(bareHost)) {
      throw new Error('Requests to private or internal network addresses are not allowed.');
    }
    return;
  }

  const results = await dns.promises.lookup(hostname, { all: true });
  if (results.length === 0) {
    throw new Error('Could not resolve hostname.');
  }
  for (const { address } of results) {
    if (isDisallowedIp(address)) {
      throw new Error('Requests to private or internal network addresses are not allowed.');
    }
  }
}

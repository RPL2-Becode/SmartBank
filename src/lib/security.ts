export function generateIdempotencyKey(prefix = 'smartbank'): string {
  const random = Math.random().toString(36).slice(2, 10).toUpperCase();
  return `${prefix}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${random}`;
}

export function buildCanonicalString(input: {
  method: string;
  path: string;
  timestamp: string;
  idempotencyKey: string;
  body: string;
}): string {
  return [
    input.method.toUpperCase(),
    input.path,
    input.timestamp,
    input.idempotencyKey,
    input.body.trim() || '{}',
  ].join('\n');
}

export function createSignaturePlaceholder(canonicalString: string): string {
  const checksum = Array.from(canonicalString).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return `hmac_sha256_server_side_${checksum.toString(16).padStart(8, '0')}`;
}

export function maskSecret(secret: string): string {
  return `${secret.slice(0, 8)}...${secret.slice(-4)}`;
}

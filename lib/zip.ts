// Minimal "stored" (uncompressed) ZIP writer — zero dependencies, runs in Node
// and the serverless runtime. Adequate for shipping a small generated codebase
// as a downloadable archive.

function crc32(buf: Uint8Array): number {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (~c) >>> 0;
}

const enc = new TextEncoder();

export interface ZipEntry {
  path: string;
  content: string | Uint8Array;
}

export function createZip(entries: ZipEntry[]): Uint8Array {
  const local: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  const dosTime = 0;
  const dosDate = 0x21; // 1980-01-01

  for (const e of entries) {
    const nameBytes = enc.encode(e.path.replace(/^\/+/, ''));
    const data = typeof e.content === 'string' ? enc.encode(e.content) : e.content;
    const crc = crc32(data);
    const size = data.length;

    const lfh = new DataView(new ArrayBuffer(30));
    lfh.setUint32(0, 0x04034b50, true);
    lfh.setUint16(4, 20, true);
    lfh.setUint16(6, 0x0800, true); // UTF-8 filename
    lfh.setUint16(8, 0, true); // stored
    lfh.setUint16(10, dosTime, true);
    lfh.setUint16(12, dosDate, true);
    lfh.setUint32(14, crc, true);
    lfh.setUint32(18, size, true);
    lfh.setUint32(22, size, true);
    lfh.setUint16(26, nameBytes.length, true);
    lfh.setUint16(28, 0, true);
    const lfhBytes = new Uint8Array(lfh.buffer);
    local.push(lfhBytes, nameBytes, data);

    const cdh = new DataView(new ArrayBuffer(46));
    cdh.setUint32(0, 0x02014b50, true);
    cdh.setUint16(4, 20, true);
    cdh.setUint16(6, 20, true);
    cdh.setUint16(8, 0x0800, true);
    cdh.setUint16(10, 0, true);
    cdh.setUint16(12, dosTime, true);
    cdh.setUint16(14, dosDate, true);
    cdh.setUint32(16, crc, true);
    cdh.setUint32(20, size, true);
    cdh.setUint32(24, size, true);
    cdh.setUint16(28, nameBytes.length, true);
    cdh.setUint16(30, 0, true);
    cdh.setUint16(32, 0, true);
    cdh.setUint16(34, 0, true);
    cdh.setUint16(36, 0, true);
    cdh.setUint32(38, 0, true);
    cdh.setUint32(42, offset, true);
    central.push(new Uint8Array(cdh.buffer), nameBytes);

    offset += lfhBytes.length + nameBytes.length + data.length;
  }

  const centralStart = offset;
  let centralSize = 0;
  for (const c of central) centralSize += c.length;

  const eocd = new DataView(new ArrayBuffer(22));
  eocd.setUint32(0, 0x06054b50, true);
  eocd.setUint16(4, 0, true);
  eocd.setUint16(6, 0, true);
  eocd.setUint16(8, entries.length, true);
  eocd.setUint16(10, entries.length, true);
  eocd.setUint32(12, centralSize, true);
  eocd.setUint32(16, centralStart, true);
  eocd.setUint16(20, 0, true);

  const parts = [...local, ...central, new Uint8Array(eocd.buffer)];
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const p of parts) {
    out.set(p, pos);
    pos += p.length;
  }
  return out;
}

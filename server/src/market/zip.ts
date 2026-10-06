import { inflateRawSync } from 'node:zlib';

/**
 * The files of a ZIP archive (stored or deflated), read through its central directory. Enough for
 * Binance's history archives (data.binance.vision): one CSV per archive.
 */
export function unzip(buf: Uint8Array): { name: string; data: Buffer }[] {
  const b = Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
  // end of central directory: signature 0x06054b50, within the last 64 KiB (comment)
  let eocd = -1;
  for (let i = b.length - 22; i >= Math.max(0, b.length - 22 - 65_535); i--) {
    if (b.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('not a ZIP archive');
  const count = b.readUInt16LE(eocd + 10);
  let p = b.readUInt32LE(eocd + 16);
  const files: { name: string; data: Buffer }[] = [];
  for (let n = 0; n < count; n++) {
    if (b.readUInt32LE(p) !== 0x02014b50) throw new Error('damaged ZIP archive');
    const method = b.readUInt16LE(p + 10);
    const size = b.readUInt32LE(p + 20);
    const nameLen = b.readUInt16LE(p + 28);
    const extraLen = b.readUInt16LE(p + 30);
    const commentLen = b.readUInt16LE(p + 32);
    const local = b.readUInt32LE(p + 42);
    const name = b.toString('utf8', p + 46, p + 46 + nameLen);
    p += 46 + nameLen + extraLen + commentLen;
    if (b.readUInt32LE(local) !== 0x04034b50) throw new Error('damaged ZIP archive');
    const start = local + 30 + b.readUInt16LE(local + 26) + b.readUInt16LE(local + 28);
    const raw = b.subarray(start, start + size);
    if (method === 0) files.push({ name, data: Buffer.from(raw) });
    else if (method === 8) files.push({ name, data: inflateRawSync(raw) });
    else throw new Error(`ZIP compression ${method} is not supported`);
  }
  return files;
}

// news-image-20261125 entry: "Sum up 25 November's world news in one image".
// Node 22, standard library only, no network. The image is entry.png beside this file, rendered once
// from design/poster.html (see design/render.sh). This program checks that the file is a whole,
// well-formed PNG within the size limits, then writes the exact same bytes to /output/entry.png,
// so every run produces identical output.
//
// Local run (MAKEFUN_OUTPUT_DIR stands in for /output):
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const MAX_BYTES = 1024 * 1024;
const MAX_SIDE = 1024;

const png = readFileSync(new URL('./entry.png', import.meta.url));
validatePng(png);

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), png);
console.log(`entry.png: ${png.length} bytes written to ${outDir}`);

// CRC-32 (IEEE), as carried by every PNG chunk over its type and data.
function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c & 1 ? (c >>> 1) ^ 0xedb88320 : c >>> 1;
  }
  return (c ^ 0xffffffff) >>> 0;
}

// Throws unless buf is a complete PNG: signature, IHDR first with a size inside the limits,
// correct CRC on every chunk, at least one IDAT, and IEND as the very last bytes.
function validatePng(buf: Buffer): void {
  if (buf.length > MAX_BYTES) throw new Error(`entry.png is ${buf.length} bytes, limit ${MAX_BYTES}`);
  const sig = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  sig.forEach((b, i) => { if (buf[i] !== b) throw new Error('entry.png has no PNG signature'); });
  let pos = 8, chunks = 0, idat = 0, done = false;
  while (pos < buf.length && !done) {
    if (pos + 12 > buf.length) throw new Error('truncated chunk header');
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    const end = pos + 12 + len;
    if (end > buf.length) throw new Error(`chunk ${type} overruns the file`);
    if (crc32(buf.subarray(pos + 4, pos + 8 + len)) !== buf.readUInt32BE(pos + 8 + len)) {
      throw new Error(`chunk ${type} CRC mismatch`);
    }
    if (chunks === 0) {
      if (type !== 'IHDR') throw new Error('first chunk is not IHDR');
      const w = buf.readUInt32BE(pos + 8), h = buf.readUInt32BE(pos + 12);
      if (w < 1 || h < 1 || w > MAX_SIDE || h > MAX_SIDE) throw new Error(`bad size ${w}x${h}`);
    }
    if (type === 'IDAT') idat++;
    if (type === 'IEND') done = true;
    chunks++;
    pos = end;
  }
  if (!done || pos !== buf.length) throw new Error('entry.png does not end cleanly with IEND');
  if (idat === 0) throw new Error('entry.png has no image data');
}

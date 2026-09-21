const LOCAL_FILE_SIGNATURE = 0x04034b50;
const CENTRAL_DIRECTORY_SIGNATURE = 0x02014b50;
const END_OF_CENTRAL_DIRECTORY_SIGNATURE = 0x06054b50;

export type ZipEntry = {
  name: string;
  data: Uint8Array;
};

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date = new Date()): { date: number; time: number } {
  const year = Math.max(1980, date.getFullYear());
  const time = (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const dosDate = ((year - 1980) << 9) | (month << 5) | day;
  return { date: dosDate, time };
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function writeLocalHeader(name: Uint8Array, data: Uint8Array, checksum: number, date: number, time: number): Uint8Array {
  const header = new ArrayBuffer(30 + name.length);
  const view = new DataView(header);
  view.setUint32(0, LOCAL_FILE_SIGNATURE, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 0x0800, true);
  view.setUint16(8, 0, true);
  view.setUint16(10, time, true);
  view.setUint16(12, date, true);
  view.setUint32(14, checksum, true);
  view.setUint32(18, data.length, true);
  view.setUint32(22, data.length, true);
  view.setUint16(26, name.length, true);
  view.setUint16(28, 0, true);
  new Uint8Array(header, 30).set(name);
  return new Uint8Array(header);
}

function writeCentralHeader(name: Uint8Array, data: Uint8Array, checksum: number, date: number, time: number, offset: number): Uint8Array {
  const header = new ArrayBuffer(46 + name.length);
  const view = new DataView(header);
  view.setUint32(0, CENTRAL_DIRECTORY_SIGNATURE, true);
  view.setUint16(4, 20, true);
  view.setUint16(6, 20, true);
  view.setUint16(8, 0x0800, true);
  view.setUint16(10, 0, true);
  view.setUint16(12, time, true);
  view.setUint16(14, date, true);
  view.setUint32(16, checksum, true);
  view.setUint32(20, data.length, true);
  view.setUint32(24, data.length, true);
  view.setUint16(28, name.length, true);
  view.setUint16(30, 0, true);
  view.setUint16(32, 0, true);
  view.setUint16(34, 0, true);
  view.setUint16(36, 0, true);
  view.setUint32(38, 0, true);
  view.setUint32(42, offset, true);
  new Uint8Array(header, 46).set(name);
  return new Uint8Array(header);
}

export function createZipBlob(entries: ZipEntry[]): Blob {
  if (entries.length === 0) throw new Error('There are no exported images to package.');
  if (entries.length > 0xffff) throw new Error('Too many images for a single ZIP archive.');

  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  const { date, time } = dosDateTime();
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.name);
    const checksum = crc32(entry.data);
    const local = writeLocalHeader(name, entry.data, checksum, date, time);
    localParts.push(local, entry.data);
    centralParts.push(writeCentralHeader(name, entry.data, checksum, date, time, offset));
    offset += local.length + entry.data.length;
  }

  const centralDirectory = concat(centralParts);
  const localData = concat(localParts);
  const end = new ArrayBuffer(22);
  const view = new DataView(end);
  view.setUint32(0, END_OF_CENTRAL_DIRECTORY_SIGNATURE, true);
  view.setUint16(4, 0, true);
  view.setUint16(6, 0, true);
  view.setUint16(8, entries.length, true);
  view.setUint16(10, entries.length, true);
  view.setUint32(12, centralDirectory.length, true);
  view.setUint32(16, localData.length, true);
  view.setUint16(20, 0, true);

  // BlobPart's current TypeScript DOM definitions require an ArrayBuffer-backed
  // view. Uint8Array can be typed over ArrayBufferLike, so copy the final
  // archive segments into plain ArrayBuffers before constructing the Blob.
  const toArrayBuffer = (data: Uint8Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(buffer).set(data);
    return buffer;
  };

  return new Blob([toArrayBuffer(localData), toArrayBuffer(centralDirectory), end], { type: 'application/zip' });
}

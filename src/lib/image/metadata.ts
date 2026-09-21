import type { ImageMetadata, ImageMetadataKind } from '@/types/editor';
import type { InputImageFormat } from './validation';

const EMPTY_METADATA: ImageMetadata = {
  kinds: [],
  hasMetadata: false,
  cameraMake: null,
  cameraModel: null,
  captureDate: null,
  orientation: null,
  iso: null,
  exposureTime: null,
  fNumber: null,
  focalLength: null,
  hasGps: false,
};

const MAX_METADATA_SCAN_BYTES = 50 * 1024 * 1024;

type MutableMetadata = ImageMetadata & { kinds: ImageMetadataKind[] };

function addKind(metadata: MutableMetadata, kind: ImageMetadataKind) {
  if (!metadata.kinds.includes(kind)) metadata.kinds.push(kind);
  metadata.hasMetadata = true;
}

function readAscii(bytes: Uint8Array<ArrayBuffer>, offset: number, length: number): string {
  const end = Math.min(bytes.length, offset + length);
  let value = '';
  for (let index = offset; index < end; index += 1) {
    const code = bytes[index];
    if (code === 0) break;
    value += String.fromCharCode(code);
  }
  return value.trim();
}

function readAsciiAt(data: DataView, offset: number, length: number): string {
  if (offset < 0 || offset + length > data.byteLength) return '';
  let value = '';
  for (let index = 0; index < length; index += 1) {
    const code = data.getUint8(offset + index);
    if (code === 0) break;
    value += String.fromCharCode(code);
  }
  return value.trim();
}

function typeSize(type: number): number {
  switch (type) {
    case 1: case 2: case 6: case 7: return 1;
    case 3: case 8: return 2;
    case 4: case 9: return 4;
    case 5: case 10: return 8;
    default: return 0;
  }
}

function readEntryValue(data: DataView, baseOffset: number, entryOffset: number, type: number, count: number, littleEndian: boolean): number | string | null {
  const size = typeSize(type);
  if (!size || count <= 0) return null;
  const byteLength = size * count;
  let valueOffset = entryOffset + 8;
  if (byteLength > 4) {
    if (valueOffset + 4 > data.byteLength) return null;
    valueOffset = baseOffset + data.getUint32(valueOffset, littleEndian);
  }
  if (valueOffset < 0 || valueOffset + byteLength > data.byteLength) return null;

  if (type === 2) return readAsciiAt(data, valueOffset, byteLength);
  if (type === 3) return data.getUint16(valueOffset, littleEndian);
  if (type === 4) return data.getUint32(valueOffset, littleEndian);
  if (type === 5) {
    const numerator = data.getUint32(valueOffset, littleEndian);
    const denominator = data.getUint32(valueOffset + 4, littleEndian);
    return denominator === 0 ? null : numerator / denominator;
  }
  return null;
}

function formatRational(value: number | null, suffix = ''): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  const rounded = Math.abs(value) >= 10 ? value.toFixed(1) : value.toFixed(3).replace(/0+$/, '').replace(/\.$/, '');
  return `${rounded}${suffix}`;
}

function parseTiff(data: DataView, baseOffset: number, metadata: MutableMetadata, depth = 0) {
  if (depth > 2 || baseOffset < 0 || baseOffset + 8 > data.byteLength) return;
  const byteOrder = readAsciiAt(data, baseOffset, 2);
  const littleEndian = byteOrder === 'II';
  if (!littleEndian && byteOrder !== 'MM') return;
  if (data.getUint16(baseOffset + 2, littleEndian) !== 42) return;
  const firstIfdOffset = data.getUint32(baseOffset + 4, littleEndian);
  const ifdStart = baseOffset + firstIfdOffset;
  if (ifdStart < baseOffset || ifdStart + 2 > data.byteLength) return;
  const count = data.getUint16(ifdStart, littleEndian);
  if (count > 512 || ifdStart + 2 + count * 12 > data.byteLength) return;

  for (let index = 0; index < count; index += 1) {
    const entry = ifdStart + 2 + index * 12;
    const tag = data.getUint16(entry, littleEndian);
    const type = data.getUint16(entry + 2, littleEndian);
    const itemCount = data.getUint32(entry + 4, littleEndian);
    const value = readEntryValue(data, baseOffset, entry, type, itemCount, littleEndian);

    if (tag === 0x010f && typeof value === 'string') metadata.cameraMake ??= value;
    if (tag === 0x0110 && typeof value === 'string') metadata.cameraModel ??= value;
    if (tag === 0x0112 && typeof value === 'number') metadata.orientation ??= value;
    if (tag === 0x0132 && typeof value === 'string' && !metadata.captureDate) metadata.captureDate = value;
    if (tag === 0x829a && typeof value === 'number') metadata.exposureTime ??= formatRational(value, ' s');
    if (tag === 0x829d && typeof value === 'number') metadata.fNumber ??= formatRational(value, '');
    if (tag === 0x8827 && typeof value === 'number') metadata.iso ??= value;
    if (tag === 0x9003 && typeof value === 'string') metadata.captureDate = value;
    if (tag === 0x920a && typeof value === 'number') metadata.focalLength ??= formatRational(value, ' mm');
    if (tag === 0x8825) metadata.hasGps = true;

    if (tag === 0x8769 && typeof value === 'number') parseTiff(data, baseOffset + value, metadata, depth + 1);
  }
}

function parseJpeg(buffer: ArrayBuffer, metadata: MutableMetadata) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 4) return;
  let offset = 2;
  while (offset + 4 <= bytes.length) {
    if (bytes[offset] !== 0xff) break;
    let marker = bytes[offset + 1];
    offset += 2;
    while (marker === 0xff && offset < bytes.length) marker = bytes[offset++];
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (marker === 0xda) break;
    if (marker >= 0xd0 && marker <= 0xd7) continue;
    if (offset + 2 > bytes.length) break;
    const length = (bytes[offset] << 8) | bytes[offset + 1];
    if (length < 2 || offset + length > bytes.length) break;
    const payloadOffset = offset + 2;
    const payloadLength = length - 2;
    if (marker === 0xe1) {
      const header = readAscii(bytes, payloadOffset, Math.min(payloadLength, 29));
      if (header.startsWith('Exif')) {
        addKind(metadata, 'EXIF');
        const tiffOffset = payloadOffset + 6;
        if (tiffOffset + 8 <= bytes.length) parseTiff(new DataView(buffer), tiffOffset, metadata);
      } else if (header.startsWith('http://ns.adobe.com/xap/1.0/')) {
        addKind(metadata, 'XMP');
      }
    } else if (marker === 0xe2 && readAscii(bytes, payloadOffset, Math.min(payloadLength, 12)).startsWith('ICC_PROFILE')) {
      addKind(metadata, 'ICC');
    } else if (marker === 0xed) {
      addKind(metadata, 'IPTC');
    } else if (marker === 0xfe) {
      addKind(metadata, 'Comment');
    } else if (marker >= 0xe0 && marker <= 0xef) {
      const signature = readAscii(bytes, payloadOffset, Math.min(payloadLength, 16));
      if (signature) addKind(metadata, 'Unknown');
    }
    offset += length;
  }
}

function parsePng(buffer: ArrayBuffer, metadata: MutableMetadata) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 24) return;
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const length = new DataView(buffer).getUint32(offset, false);
    const type = readAscii(bytes, offset + 4, 4);
    if (length > bytes.length - offset - 12) break;
    const dataOffset = offset + 8;
    if (type === 'eXIf') addKind(metadata, 'EXIF');
    else if (type === 'iTXt') {
      const text = readAscii(bytes, dataOffset, Math.min(length, 512));
      if (text.toLowerCase().includes('xml') || text.toLowerCase().includes('xmp')) addKind(metadata, 'XMP');
      else addKind(metadata, 'Text');
    } else if (type === 'tEXt' || type === 'zTXt') addKind(metadata, 'Text');
    else if (type === 'iCCP') addKind(metadata, 'ICC');
    offset += 12 + length;
    if (type === 'IEND') break;
  }
}

function parseWebp(buffer: ArrayBuffer, metadata: MutableMetadata) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 12) return;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = readAscii(bytes, offset, 4);
    const size = new DataView(buffer).getUint32(offset + 4, true);
    if (size > bytes.length - offset - 8) break;
    if (type === 'EXIF') addKind(metadata, 'EXIF');
    else if (type === 'XMP ') addKind(metadata, 'XMP');
    else if (type === 'ICCP') addKind(metadata, 'ICC');
    offset += 8 + size + (size % 2);
  }
}

function parseGif(buffer: ArrayBuffer, metadata: MutableMetadata) {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 14) return;
  let offset = 13;
  while (offset < bytes.length) {
    const marker = bytes[offset++];
    if (marker === 0x3b) break;
    if (marker === 0x21) {
      if (offset >= bytes.length) break;
      const label = bytes[offset++];
      if (label === 0xfe) addKind(metadata, 'Comment');
      else if (label === 0xff) addKind(metadata, 'Unknown');
      while (offset < bytes.length) {
        const blockSize = bytes[offset++];
        if (blockSize === 0) break;
        offset += blockSize;
      }
    } else if (marker === 0x2c) {
      if (offset + 9 > bytes.length) break;
      const packed = bytes[offset + 8];
      offset += 9;
      if (packed & 0x80) offset += 3 * (1 << ((packed & 0x07) + 1));
      if (offset >= bytes.length) break;
      offset += 1;
      while (offset < bytes.length) {
        const blockSize = bytes[offset++];
        if (blockSize === 0) break;
        offset += blockSize;
      }
    } else {
      break;
    }
  }
}

export async function readImageMetadata(file: File, format: InputImageFormat): Promise<ImageMetadata> {
  const metadata: MutableMetadata = structuredClone(EMPTY_METADATA);
  try {
    const buffer = await file.slice(0, MAX_METADATA_SCAN_BYTES).arrayBuffer();
    if (format === 'jpeg') parseJpeg(buffer, metadata);
    else if (format === 'png') parsePng(buffer, metadata);
    else if (format === 'webp') parseWebp(buffer, metadata);
    else parseGif(buffer, metadata);
  } catch {
    return EMPTY_METADATA;
  }
  return metadata;
}

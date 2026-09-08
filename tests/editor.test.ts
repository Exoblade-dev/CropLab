import { describe, expect, it } from 'vitest';
import { getFileExtension, getMimeType, getOutputDimensions } from '@/lib/image/export';

describe('image export helpers', () => {
  const crop = { x: 0, y: 0, width: 1200, height: 800 };
  it('keeps crop dimensions by default', () => expect(getOutputDimensions(crop, { format:'png', quality:.9, width:null, height:null, lockAspectRatio:true })).toEqual({width:1200,height:800}));
  it('derives height from width', () => expect(getOutputDimensions(crop, { format:'jpeg', quality:.8, width:600, height:null, lockAspectRatio:true })).toEqual({width:600,height:400}));
  it('derives width from height', () => expect(getOutputDimensions(crop, { format:'webp', quality:.8, width:null, height:400, lockAspectRatio:true })).toEqual({width:600,height:400}));
  it('uses both explicit dimensions', () => expect(getOutputDimensions(crop, { format:'png', quality:.9, width:640, height:480, lockAspectRatio:false })).toEqual({width:640,height:480}));
  it('maps output formats', () => { expect(getMimeType('png')).toBe('image/png'); expect(getMimeType('jpeg')).toBe('image/jpeg'); expect(getMimeType('webp')).toBe('image/webp'); expect(getFileExtension('jpeg')).toBe('jpeg'); });
});

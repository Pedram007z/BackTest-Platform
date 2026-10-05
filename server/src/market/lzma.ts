/**
 * LZMA ("alone" / .lzma format) decoder, enough to read Dukascopy .bi5 files without a native
 * dependency. A straight port of the reference decoder (LzmaSpec.cpp from the LZMA SDK, public domain).
 */

const PROB_INIT = 1024;
const TOP = 1 << 24;
const NUM_STATES = 12;
const POS_BITS_MAX = 4;
const LEN_TO_POS_STATES = 4;
const ALIGN_BITS = 4;
const END_POS_MODEL_INDEX = 14;
const FULL_DISTANCES = 1 << (END_POS_MODEL_INDEX >>> 1);
const MATCH_MIN_LEN = 2;

const probs = (n: number) => new Uint16Array(n).fill(PROB_INIT);

class RangeDecoder {
  range = 0xffffffff;
  code = 0;
  corrupted = false;
  constructor(
    private buf: Uint8Array,
    public pos: number,
  ) {
    if (this.next() !== 0) this.corrupted = true;
    for (let i = 0; i < 4; i++) this.code = ((this.code << 8) | this.next()) >>> 0;
    if (this.code === this.range) this.corrupted = true;
  }
  private next(): number {
    if (this.pos >= this.buf.length) throw new Error('lzma: unexpected end of input');
    return this.buf[this.pos++];
  }
  finishedOk = () => this.code === 0;
  private normalize() {
    if (this.range < TOP) {
      this.range = (this.range << 8) >>> 0;
      this.code = ((this.code << 8) | this.next()) >>> 0;
    }
  }
  direct(numBits: number): number {
    let res = 0;
    do {
      this.range >>>= 1;
      let bit = 0;
      if (this.code >= this.range) {
        this.code -= this.range;
        bit = 1;
      }
      if (this.code === this.range) this.corrupted = true;
      this.normalize();
      res = ((res << 1) | bit) >>> 0;
    } while (--numBits);
    return res;
  }
  bit(p: Uint16Array, i: number): number {
    const v = p[i];
    const bound = (this.range >>> 11) * v;
    let symbol: number;
    if (this.code < bound) {
      p[i] = v + ((2048 - v) >>> 5);
      this.range = bound;
      symbol = 0;
    } else {
      p[i] = v - (v >>> 5);
      this.code -= bound;
      this.range -= bound;
      symbol = 1;
    }
    this.normalize();
    return symbol;
  }
}

function treeDecode(p: Uint16Array, offset: number, numBits: number, rc: RangeDecoder): number {
  let m = 1;
  for (let i = 0; i < numBits; i++) m = (m << 1) + rc.bit(p, offset + m);
  return m - (1 << numBits);
}

function treeReverse(p: Uint16Array, offset: number, numBits: number, rc: RangeDecoder): number {
  let m = 1;
  let symbol = 0;
  for (let i = 0; i < numBits; i++) {
    const bit = rc.bit(p, offset + m);
    m = (m << 1) + bit;
    symbol |= bit << i;
  }
  return symbol;
}

class LenDecoder {
  private choice = probs(2);
  private low = probs((1 << POS_BITS_MAX) << 3);
  private mid = probs((1 << POS_BITS_MAX) << 3);
  private high = probs(1 << 8);
  decode(rc: RangeDecoder, posState: number): number {
    if (rc.bit(this.choice, 0) === 0) return treeDecode(this.low, posState << 3, 3, rc);
    if (rc.bit(this.choice, 1) === 0) return 8 + treeDecode(this.mid, posState << 3, 3, rc);
    return 16 + treeDecode(this.high, 0, 8, rc);
  }
}

/** Decompress an .lzma ("alone") buffer: 5 property bytes, 8-byte size, then the range-coded stream. */
export function lzmaDecompress(input: Uint8Array): Uint8Array {
  if (input.length < 13) throw new Error('lzma: header too short');
  let d = input[0];
  if (d >= 9 * 5 * 5) throw new Error('lzma: bad properties');
  const lc = d % 9;
  d = Math.floor(d / 9);
  const lp = d % 5;
  const pb = Math.floor(d / 5);
  let dictSize = 0;
  for (let i = 0; i < 4; i++) dictSize += input[1 + i] * 2 ** (8 * i);
  dictSize = Math.max(dictSize, 1 << 12);

  let sizeKnown = false;
  let unpackSize = 0;
  for (let i = 0; i < 8; i++) {
    if (input[5 + i] !== 0xff) sizeKnown = true;
    unpackSize += input[5 + i] * 2 ** (8 * i);
  }
  if (sizeKnown && unpackSize > 512 * 1024 * 1024) throw new Error('lzma: output too large');

  let out = new Uint8Array(sizeKnown ? unpackSize : Math.max(1024, input.length * 8));
  let outPos = 0;
  const put = (b: number) => {
    if (outPos >= out.length) {
      const grown = new Uint8Array(out.length * 2);
      grown.set(out);
      out = grown;
    }
    out[outPos++] = b;
  };
  const get = (dist: number) => out[outPos - dist];

  const rc = new RangeDecoder(input, 13);
  const literal = probs(0x300 << (lc + lp));
  const posSlot = probs(LEN_TO_POS_STATES << 6);
  const posDecoders = probs(1 + FULL_DISTANCES - END_POS_MODEL_INDEX);
  const align = probs(1 << ALIGN_BITS);
  const isMatch = probs(NUM_STATES << POS_BITS_MAX);
  const isRep = probs(NUM_STATES);
  const isRepG0 = probs(NUM_STATES);
  const isRepG1 = probs(NUM_STATES);
  const isRepG2 = probs(NUM_STATES);
  const isRep0Long = probs(NUM_STATES << POS_BITS_MAX);
  const lenDecoder = new LenDecoder();
  const repLenDecoder = new LenDecoder();
  const pbMask = (1 << pb) - 1;
  const lpMask = (1 << lp) - 1;

  let state = 0;
  let rep0 = 0;
  let rep1 = 0;
  let rep2 = 0;
  let rep3 = 0;
  let remaining = unpackSize;

  const decodeLiteral = () => {
    const prev = outPos === 0 ? 0 : get(1);
    let symbol = 1;
    const base = 0x300 * (((outPos & lpMask) << lc) + (prev >>> (8 - lc)));
    if (state >= 7) {
      let matchByte = get(rep0 + 1);
      do {
        const matchBit = (matchByte >>> 7) & 1;
        matchByte <<= 1;
        const bit = rc.bit(literal, base + ((1 + matchBit) << 8) + symbol);
        symbol = (symbol << 1) | bit;
        if (matchBit !== bit) break;
      } while (symbol < 0x100);
    }
    while (symbol < 0x100) symbol = (symbol << 1) | rc.bit(literal, base + symbol);
    put(symbol - 0x100);
  };

  const decodeDistance = (len: number): number => {
    const slot = treeDecode(posSlot, Math.min(len, LEN_TO_POS_STATES - 1) << 6, 6, rc);
    if (slot < 4) return slot;
    const numDirect = (slot >>> 1) - 1;
    let dist = ((2 | (slot & 1)) << numDirect) >>> 0;
    if (slot < END_POS_MODEL_INDEX) dist += treeReverse(posDecoders, dist - slot, numDirect, rc);
    else {
      dist += rc.direct(numDirect - ALIGN_BITS) * 16;
      dist += treeReverse(align, 0, ALIGN_BITS, rc);
    }
    return dist;
  };

  for (;;) {
    if (sizeKnown && remaining === 0 && rc.finishedOk()) break;
    const posState = outPos & pbMask;
    if (rc.bit(isMatch, (state << POS_BITS_MAX) + posState) === 0) {
      if (sizeKnown && remaining === 0) throw new Error('lzma: data after end');
      decodeLiteral();
      state = state < 4 ? 0 : state < 10 ? state - 3 : state - 6;
      remaining--;
      continue;
    }
    let len: number;
    if (rc.bit(isRep, state) !== 0) {
      if (sizeKnown && remaining === 0) throw new Error('lzma: data after end');
      if (outPos === 0) throw new Error('lzma: corrupted data');
      if (rc.bit(isRepG0, state) === 0) {
        if (rc.bit(isRep0Long, (state << POS_BITS_MAX) + posState) === 0) {
          state = state < 7 ? 9 : 11;
          put(get(rep0 + 1));
          remaining--;
          continue;
        }
      } else {
        let dist: number;
        if (rc.bit(isRepG1, state) === 0) dist = rep1;
        else {
          if (rc.bit(isRepG2, state) === 0) dist = rep2;
          else {
            dist = rep3;
            rep3 = rep2;
          }
          rep2 = rep1;
        }
        rep1 = rep0;
        rep0 = dist;
      }
      len = repLenDecoder.decode(rc, posState);
      state = state < 7 ? 8 : 11;
    } else {
      rep3 = rep2;
      rep2 = rep1;
      rep1 = rep0;
      len = lenDecoder.decode(rc, posState);
      state = state < 7 ? 7 : 10;
      rep0 = decodeDistance(len);
      if (rep0 === 0xffffffff) {
        if (!rc.finishedOk()) throw new Error('lzma: corrupted end marker');
        break;
      }
      if (sizeKnown && remaining === 0) throw new Error('lzma: data after end');
      if (rep0 >= dictSize || rep0 >= outPos) throw new Error('lzma: distance out of range');
    }
    len += MATCH_MIN_LEN;
    if (sizeKnown && len > remaining) throw new Error('lzma: match past end');
    for (let i = 0; i < len; i++) put(get(rep0 + 1));
    remaining -= len;
  }
  if (rc.corrupted) throw new Error('lzma: corrupted data');
  return out.subarray(0, outPos);
}

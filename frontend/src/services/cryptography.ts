import { randomBytes } from 'crypto';

export type Hex = `0x${string}`;

export const G: bigint = 3n;
export const FIELD: bigint =
  21888242871839275222246405745257275088548364400416034343698204186575808495617n;

const FIELD_BYTE_LEN: number = 32;
const BYTES32_HEX_LEN = 64;

function bytesToBigInt(bytes: Uint8Array): bigint {
  const hex = '0x' + Array.from(bytes, (b: number) => b.toString(16).padStart(2, '0')).join('');
  return BigInt(hex);
}

function toBytes32(value: bigint | number | string): Hex {
  const v = BigInt(value);
  if (v < 0n) throw new Error('toBytes32: negative values not supported');
  const hex = v.toString(16).padStart(BYTES32_HEX_LEN, '0');
  return (`0x${hex}`) as Hex;
}

export class CryptoMath {
  private static _instance: CryptoMath | undefined;
  private constructor() {}
  static get instance(): CryptoMath {
    if (!this._instance) this._instance = new CryptoMath();
    return this._instance;
  }

  readonly G: bigint = G;
  readonly FIELD: bigint = FIELD;

  getRandomValue(): bigint {
    let x: bigint = 0n;
    do {
      const buf: Uint8Array = randomBytes(FIELD_BYTE_LEN);
      x = bytesToBigInt(buf);
    } while (x === 0n || x >= FIELD);
    return x;
  }

  modExp(
    base: bigint | number | string,
    exponent: bigint | number | string,
    mod: bigint = FIELD
  ): bigint {
    let b = BigInt(base) % mod;
    let e = BigInt(exponent);
    if (e < 0n) throw new Error('modExp: negative exponent not supported');

    let result: bigint = 1n;
    while (e > 0n) {
      if (e & 1n) result = (result * b) % mod;
      b = (b * b) % mod;
      e >>= 1n;
    }
    return result;
  }

  toBytes32(value: bigint | number | string): Hex {
    return toBytes32(value);
  }

  generateEmptyProof(): Hex {
    return '0x';
  }
}

export default CryptoMath.instance;

export function getRandomValue(): bigint {
  return CryptoMath.instance.getRandomValue();
}

export function modExp(
  base: bigint | number | string,
  exponent: bigint | number | string,
  mod: bigint = FIELD
): bigint {
  return CryptoMath.instance.modExp(base, exponent, mod);
}

export function generateEmptyProof(): Hex {
  return CryptoMath.instance.generateEmptyProof();
}

export function bigIntToBytes32(value: bigint | number | string): Hex {
  return CryptoMath.instance.toBytes32(value);
}

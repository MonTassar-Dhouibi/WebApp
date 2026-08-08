var BTC = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // crypto.js
  var crypto_exports = {};
  __export(crypto_exports, {
    deriveKeyData: () => deriveKeyData
  });

  // node_modules/@noble/secp256k1/index.js
  var secp256k1_CURVE = Object.freeze({
    p: 0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2fn,
    n: 0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141n,
    h: 1n,
    a: 0n,
    b: 7n,
    Gx: 0x79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798n,
    Gy: 0x483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8n
  });
  var { p: P, n: N, Gx, Gy, b: _b } = secp256k1_CURVE;
  var L = 32;
  var L2 = 64;
  var lengths = {
    publicKey: L + 1,
    publicKeyUncompressed: L2 + 1,
    signature: L2,
    // 48-byte keygen seed floor: 384 bits exceeds FIPS 186-5 Table A.2's
    // 352-bit recommendation for 256-bit prime curves.
    seed: L + L / 2
  };
  var err = (message = "", E = Error) => {
    const e = new E(message);
    const { captureStackTrace } = Error;
    if (typeof captureStackTrace === "function")
      captureStackTrace(e, err);
    throw e;
  };
  var isBytes = (a) => a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && a.BYTES_PER_ELEMENT === 1;
  var abytes = (value, length, title = "") => {
    const bytes = isBytes(value);
    const len = value?.length;
    const needsLen = length !== void 0;
    if (!bytes || needsLen && len !== length) {
      const prefix = title && `"${title}" `;
      const ofLen = needsLen ? ` of length ${length}` : "";
      const got = bytes ? `length=${len}` : `type=${typeof value}`;
      const msg = prefix + "expected Uint8Array" + ofLen + ", got " + got;
      return bytes ? err(msg, RangeError) : err(msg, TypeError);
    }
    return value;
  };
  var u8n = (len) => new Uint8Array(len);
  var padh = (n, pad) => n.toString(16).padStart(pad, "0");
  var bytesToHex = (b) => {
    let hex = "";
    for (const e of abytes(b))
      hex += padh(e, 2);
    return hex;
  };
  var C = { _0: 48, _9: 57, A: 65, F: 70, a: 97, f: 102 };
  var _ch = (ch) => ch >= C._0 && ch <= C._9 ? ch - C._0 : ch >= C.A && ch <= C.F ? ch - (C.A - 10) : ch >= C.a && ch <= C.f ? ch - (C.a - 10) : void 0;
  var hexToBytes = (hex) => {
    const e = "hex invalid";
    if (typeof hex !== "string")
      return err(e);
    const hl = hex.length;
    const al = hl / 2;
    if (hl % 2)
      return err(e);
    const array = u8n(al);
    for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
      const n1 = _ch(hex.charCodeAt(hi));
      const n2 = _ch(hex.charCodeAt(hi + 1));
      if (n1 === void 0 || n2 === void 0)
        return err(e);
      array[ai] = n1 * 16 + n2;
    }
    return array;
  };
  var concatBytes = (...arrs) => {
    let len = 0;
    for (const a of arrs)
      len += abytes(a).length;
    const r = u8n(len);
    let pad = 0;
    for (const a of arrs)
      r.set(a, pad), pad += a.length;
    return r;
  };
  var big = BigInt;
  var arange = (n, min, max, msg = "bad number: out of range") => {
    if (typeof n !== "bigint")
      return err(msg, TypeError);
    if (min <= n && n < max)
      return n;
    return err(msg, RangeError);
  };
  var M = (a, b = P) => {
    const r = a % b;
    return r >= 0n ? r : b + r;
  };
  var invert = (num, md) => {
    if (num === 0n || md <= 0n)
      err("no inverse n=" + num + " mod=" + md);
    let a = M(num, md), b = md, x = 0n, y = 1n, u = 1n, v = 0n;
    while (a !== 0n) {
      const q = b / a, r = b % a;
      const m = x - u * q, n = y - v * q;
      b = a, a = r, x = u, y = v, u = m, v = n;
    }
    return b === 1n ? M(x, md) : err("no inverse");
  };
  var apoint = (p) => p instanceof Point ? p : err("Point expected");
  var koblitz = (x) => M(M(x * x) * x + _b);
  var FpIsValid = (n) => arange(n, 0n, P);
  var FpIsValidNot0 = (n) => arange(n, 1n, P);
  var FnIsValidNot0 = (n) => arange(n, 1n, N);
  var isEven = (y) => !(y & 1n);
  var u8of = (n) => Uint8Array.of(n);
  var getPrefix = (y) => u8of(isEven(y) ? 2 : 3);
  var lift_x = (x) => {
    const c = koblitz(FpIsValidNot0(x));
    let r = 1n;
    for (let num = c, e = (P + 1n) / 4n; e > 0n; e >>= 1n) {
      if (e & 1n)
        r = r * num % P;
      num = num * num % P;
    }
    if (M(r * r) !== c)
      err("sqrt invalid");
    return isEven(r) ? r : M(-r);
  };
  var _Point = class _Point {
    constructor(X, Y, Z) {
      __publicField(this, "X");
      __publicField(this, "Y");
      __publicField(this, "Z");
      this.X = FpIsValid(X);
      this.Y = FpIsValidNot0(Y);
      this.Z = FpIsValid(Z);
      Object.freeze(this);
    }
    /** Returns the shared curve metadata object by reference.
     * It is readonly only at type level, and mutating it won't retarget arithmetic,
     * which already uses module-load snapshots. */
    static CURVE() {
      return secp256k1_CURVE;
    }
    /** Create 3d xyz point from 2d xy. (0, 0) => (0, 1, 0), not (0, 0, 1) */
    static fromAffine(ap) {
      const { x, y } = ap;
      return x === 0n && y === 0n ? I : new _Point(x, y, 1n);
    }
    /** Convert Uint8Array or hex string to Point. */
    static fromBytes(bytes) {
      abytes(bytes);
      const { publicKey: comp, publicKeyUncompressed: uncomp } = lengths;
      let p = void 0;
      const length = bytes.length;
      const head = bytes[0];
      const tail = bytes.subarray(1);
      const x = sliceBytesNumBE(tail, 0, L);
      if (length === comp && (head === 2 || head === 3)) {
        let y = lift_x(x);
        if (head === 3)
          y = M(-y);
        p = new _Point(x, y, 1n);
      }
      if (length === uncomp && head === 4)
        p = new _Point(x, sliceBytesNumBE(tail, L, L2), 1n);
      return p ? p.assertValidity() : err("bad point: not on curve");
    }
    static fromHex(hex) {
      return _Point.fromBytes(hexToBytes(hex));
    }
    get x() {
      return this.toAffine().x;
    }
    get y() {
      return this.toAffine().y;
    }
    /** Equality check: compare points P&Q. */
    equals(other) {
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = apoint(other);
      const X1Z2 = M(X1 * Z2);
      const X2Z1 = M(X2 * Z1);
      const Y1Z2 = M(Y1 * Z2);
      const Y2Z1 = M(Y2 * Z1);
      return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
    }
    is0() {
      return this.equals(I);
    }
    /** Flip point over y coordinate. */
    negate() {
      return new _Point(this.X, M(-this.Y), this.Z);
    }
    /** Point doubling: P+P, complete formula. */
    double() {
      return this.add(this);
    }
    /**
     * Point addition: P+Q, complete, exception-free formula
     * (Renes-Costello-Batina, algo 1 of [2015/1060](https://eprint.iacr.org/2015/1060)).
     * Cost: `12M + 0S + 3*a + 3*b3 + 23add`.
     */
    // prettier-ignore
    add(other) {
      const { X: X1, Y: Y1, Z: Z1 } = this;
      const { X: X2, Y: Y2, Z: Z2 } = apoint(other);
      const a = 0n;
      const b = _b;
      let X3 = 0n, Y3 = 0n, Z3 = 0n;
      const b3 = M(b * 3n);
      let t0 = M(X1 * X2), t1 = M(Y1 * Y2), t2 = M(Z1 * Z2), t3 = M(X1 + Y1);
      let t4 = M(X2 + Y2);
      t3 = M(t3 * t4);
      t4 = M(t0 + t1);
      t3 = M(t3 - t4);
      t4 = M(X1 + Z1);
      let t5 = M(X2 + Z2);
      t4 = M(t4 * t5);
      t5 = M(t0 + t2);
      t4 = M(t4 - t5);
      t5 = M(Y1 + Z1);
      X3 = M(Y2 + Z2);
      t5 = M(t5 * X3);
      X3 = M(t1 + t2);
      t5 = M(t5 - X3);
      Z3 = M(a * t4);
      X3 = M(b3 * t2);
      Z3 = M(X3 + Z3);
      X3 = M(t1 - Z3);
      Z3 = M(t1 + Z3);
      Y3 = M(X3 * Z3);
      t1 = M(t0 + t0);
      t1 = M(t1 + t0);
      t2 = M(a * t2);
      t4 = M(b3 * t4);
      t1 = M(t1 + t2);
      t2 = M(t0 - t2);
      t2 = M(a * t2);
      t4 = M(t4 + t2);
      t0 = M(t1 * t4);
      Y3 = M(Y3 + t0);
      t0 = M(t5 * t4);
      X3 = M(t3 * X3);
      X3 = M(X3 - t0);
      t0 = M(t3 * t1);
      Z3 = M(t5 * Z3);
      Z3 = M(Z3 + t0);
      return new _Point(X3, Y3, Z3);
    }
    subtract(other) {
      return this.add(apoint(other).negate());
    }
    /**
     * Point-by-scalar multiplication. Scalar must be in range 1 <= n < CURVE.n.
     * Uses {@link wNAF} for base point.
     * Uses fake point to mitigate leakage shape in JS, not as a hard constant-time guarantee.
     * @param n scalar by which point is multiplied
     * @param safe safe mode guards against timing attacks; unsafe mode is faster
     */
    multiply(n, safe = true) {
      if (!safe && n === 0n)
        return I;
      FnIsValidNot0(n);
      if (n === 1n)
        return this;
      if (this.equals(G))
        return wNAF(n).p;
      let p = I;
      let f = G;
      for (let d = this; n > 0n; d = d.double(), n >>= 1n) {
        if (n & 1n)
          p = p.add(d);
        else if (safe)
          f = f.add(d);
      }
      return p;
    }
    multiplyUnsafe(scalar) {
      return this.multiply(scalar, false);
    }
    /** Convert point to 2d xy affine point. (X, Y, Z) ∋ (x=X/Z, y=Y/Z) */
    toAffine() {
      const { X: x, Y: y, Z: z } = this;
      if (this.equals(I))
        return { x: 0n, y: 0n };
      if (z === 1n)
        return { x, y };
      const iz = invert(z, P);
      if (M(z * iz) !== 1n)
        err("inverse invalid");
      return { x: M(x * iz), y: M(y * iz) };
    }
    /** Checks if the point is valid and on-curve. */
    assertValidity() {
      const { x, y } = this.toAffine();
      FpIsValidNot0(x);
      FpIsValidNot0(y);
      return M(y * y) === koblitz(x) ? this : err("bad point: not on curve");
    }
    /** Converts point to 33/65-byte Uint8Array. */
    toBytes(isCompressed = true) {
      const { x, y } = this.assertValidity().toAffine();
      const x32b = numTo32b(x);
      if (isCompressed)
        return concatBytes(getPrefix(y), x32b);
      return concatBytes(u8of(4), x32b, numTo32b(y));
    }
    toHex(isCompressed) {
      return bytesToHex(this.toBytes(isCompressed));
    }
  };
  __publicField(_Point, "BASE");
  __publicField(_Point, "ZERO");
  var Point = _Point;
  var G = new Point(Gx, Gy, 1n);
  var I = new Point(0n, 1n, 0n);
  Point.BASE = G;
  Point.ZERO = I;
  var bytesToNumBE = (b) => big("0x" + (bytesToHex(b) || "0"));
  var sliceBytesNumBE = (b, from, to) => bytesToNumBE(b.subarray(from, to));
  var B256 = 2n ** 256n;
  var numTo32b = (num) => hexToBytes(padh(arange(num, 0n, B256), L2));
  var secretKeyToScalar = (secretKey) => {
    const num = bytesToNumBE(abytes(secretKey, L, "secret key"));
    return arange(num, 1n, N, "invalid secret key: outside of range");
  };
  var getPublicKey = (privKey, isCompressed = true) => {
    return G.multiply(secretKeyToScalar(privKey)).toBytes(isCompressed);
  };
  var W = 8;
  var scalarBits = 256;
  var pwindows = Math.ceil(scalarBits / W) + 1;
  var pwindowSize = 2 ** (W - 1);
  var precompute = () => {
    const points = [];
    let p = G;
    let b = p;
    for (let w = 0; w < pwindows; w++) {
      b = p;
      points.push(b);
      for (let i = 1; i < pwindowSize; i++) {
        b = b.add(p);
        points.push(b);
      }
      p = b.double();
    }
    return points;
  };
  var Gpows = void 0;
  var ctneg = (cnd, p) => {
    const n = p.negate();
    return cnd ? n : p;
  };
  var wNAF = (n) => {
    const comp = Gpows || (Gpows = precompute());
    let p = I;
    let f = G;
    const pow_2_w = 2 ** W;
    const maxNum = pow_2_w;
    const mask = big(pow_2_w - 1);
    const shiftBy = big(W);
    for (let w = 0; w < pwindows; w++) {
      let wbits = Number(n & mask);
      n >>= shiftBy;
      if (wbits > pwindowSize) {
        wbits -= maxNum;
        n += 1n;
      }
      const off = w * pwindowSize;
      const offF = off;
      const offP = off + Math.abs(wbits) - 1;
      const isEven2 = w % 2 !== 0;
      const isNeg = wbits < 0;
      if (wbits === 0) {
        f = f.add(ctneg(isEven2, comp[offF]));
      } else {
        p = p.add(ctneg(isNeg, comp[offP]));
      }
    }
    if (n !== 0n)
      err("invalid wnaf");
    return { p, f };
  };

  // node_modules/@noble/hashes/utils.js
  function isBytes2(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
  }
  function abytes2(value, length, title = "") {
    const bytes = isBytes2(value);
    const len = value?.length;
    const needsLen = length !== void 0;
    if (!bytes || needsLen && len !== length) {
      const prefix = title && `"${title}" `;
      const ofLen = needsLen ? ` of length ${length}` : "";
      const got = bytes ? `length=${len}` : `type=${typeof value}`;
      const message = prefix + "expected Uint8Array" + ofLen + ", got " + got;
      if (!bytes)
        throw new TypeError(message);
      throw new RangeError(message);
    }
    return value;
  }
  function aexists(instance, checkFinished = true) {
    if (instance.destroyed)
      throw new Error("Hash instance has been destroyed");
    if (checkFinished && instance.finished)
      throw new Error("Hash#digest() has already been called");
  }
  function aoutput(out, instance) {
    abytes2(out, void 0, "digestInto() output");
    const min = instance.outputLen;
    if (out.length < min) {
      throw new RangeError('"digestInto() output" expected to be of length >=' + min);
    }
  }
  function clean(...arrays) {
    for (let i = 0; i < arrays.length; i++) {
      arrays[i].fill(0);
    }
  }
  function createView(arr) {
    return new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
  }
  function rotr(word, shift) {
    return word << 32 - shift | word >>> shift;
  }
  function rotl(word, shift) {
    return word << shift | word >>> 32 - shift >>> 0;
  }
  function createHasher(hashCons, info = {}) {
    const hashC = (msg, opts) => hashCons(opts).update(msg).digest();
    const tmp = hashCons(void 0);
    hashC.outputLen = tmp.outputLen;
    hashC.blockLen = tmp.blockLen;
    hashC.canXOF = tmp.canXOF;
    hashC.create = (opts) => hashCons(opts);
    Object.assign(hashC, info);
    return Object.freeze(hashC);
  }
  var oidNist = (suffix) => ({
    // Current NIST hashAlgs suffixes used here fit in one DER subidentifier octet.
    // Larger suffix values would need base-128 OID encoding and a different length byte.
    oid: Uint8Array.from([6, 9, 96, 134, 72, 1, 101, 3, 4, 2, suffix])
  });

  // node_modules/@noble/hashes/_md.js
  function Chi(a, b, c) {
    return a & b ^ ~a & c;
  }
  function Maj(a, b, c) {
    return a & b ^ a & c ^ b & c;
  }
  var HashMD = class {
    constructor(blockLen, outputLen, padOffset, isLE) {
      __publicField(this, "blockLen");
      __publicField(this, "outputLen");
      __publicField(this, "canXOF", false);
      __publicField(this, "padOffset");
      __publicField(this, "isLE");
      // For partial updates less than block size
      __publicField(this, "buffer");
      __publicField(this, "view");
      __publicField(this, "finished", false);
      __publicField(this, "length", 0);
      __publicField(this, "pos", 0);
      __publicField(this, "destroyed", false);
      this.blockLen = blockLen;
      this.outputLen = outputLen;
      this.padOffset = padOffset;
      this.isLE = isLE;
      this.buffer = new Uint8Array(blockLen);
      this.view = createView(this.buffer);
    }
    update(data) {
      aexists(this);
      abytes2(data);
      const { view, buffer, blockLen } = this;
      const len = data.length;
      for (let pos = 0; pos < len; ) {
        const take = Math.min(blockLen - this.pos, len - pos);
        if (take === blockLen) {
          const dataView = createView(data);
          for (; blockLen <= len - pos; pos += blockLen)
            this.process(dataView, pos);
          continue;
        }
        buffer.set(data.subarray(pos, pos + take), this.pos);
        this.pos += take;
        pos += take;
        if (this.pos === blockLen) {
          this.process(view, 0);
          this.pos = 0;
        }
      }
      this.length += data.length;
      this.roundClean();
      return this;
    }
    digestInto(out) {
      aexists(this);
      aoutput(out, this);
      this.finished = true;
      const { buffer, view, blockLen, isLE } = this;
      let { pos } = this;
      buffer[pos++] = 128;
      clean(this.buffer.subarray(pos));
      if (this.padOffset > blockLen - pos) {
        this.process(view, 0);
        pos = 0;
      }
      for (let i = pos; i < blockLen; i++)
        buffer[i] = 0;
      view.setBigUint64(blockLen - 8, BigInt(this.length * 8), isLE);
      this.process(view, 0);
      const oview = createView(out);
      const len = this.outputLen;
      if (len % 4)
        throw new Error("_sha2: outputLen must be aligned to 32bit");
      const outLen = len / 4;
      const state = this.get();
      if (outLen > state.length)
        throw new Error("_sha2: outputLen bigger than state");
      for (let i = 0; i < outLen; i++)
        oview.setUint32(4 * i, state[i], isLE);
    }
    digest() {
      const { buffer, outputLen } = this;
      this.digestInto(buffer);
      const res = buffer.slice(0, outputLen);
      this.destroy();
      return res;
    }
    _cloneInto(to) {
      to || (to = new this.constructor());
      to.set(...this.get());
      const { blockLen, buffer, length, finished, destroyed, pos } = this;
      to.destroyed = destroyed;
      to.finished = finished;
      to.length = length;
      to.pos = pos;
      if (length % blockLen)
        to.buffer.set(buffer);
      return to;
    }
    clone() {
      return this._cloneInto();
    }
  };
  var SHA256_IV = /* @__PURE__ */ Uint32Array.from([
    1779033703,
    3144134277,
    1013904242,
    2773480762,
    1359893119,
    2600822924,
    528734635,
    1541459225
  ]);

  // node_modules/@noble/hashes/sha2.js
  var SHA256_K = /* @__PURE__ */ Uint32Array.from([
    1116352408,
    1899447441,
    3049323471,
    3921009573,
    961987163,
    1508970993,
    2453635748,
    2870763221,
    3624381080,
    310598401,
    607225278,
    1426881987,
    1925078388,
    2162078206,
    2614888103,
    3248222580,
    3835390401,
    4022224774,
    264347078,
    604807628,
    770255983,
    1249150122,
    1555081692,
    1996064986,
    2554220882,
    2821834349,
    2952996808,
    3210313671,
    3336571891,
    3584528711,
    113926993,
    338241895,
    666307205,
    773529912,
    1294757372,
    1396182291,
    1695183700,
    1986661051,
    2177026350,
    2456956037,
    2730485921,
    2820302411,
    3259730800,
    3345764771,
    3516065817,
    3600352804,
    4094571909,
    275423344,
    430227734,
    506948616,
    659060556,
    883997877,
    958139571,
    1322822218,
    1537002063,
    1747873779,
    1955562222,
    2024104815,
    2227730452,
    2361852424,
    2428436474,
    2756734187,
    3204031479,
    3329325298
  ]);
  var SHA256_W = /* @__PURE__ */ new Uint32Array(64);
  var SHA2_32B = class extends HashMD {
    constructor(outputLen) {
      super(64, outputLen, 8, false);
    }
    get() {
      const { A, B, C: C2, D, E, F, G: G2, H } = this;
      return [A, B, C2, D, E, F, G2, H];
    }
    // prettier-ignore
    set(A, B, C2, D, E, F, G2, H) {
      this.A = A | 0;
      this.B = B | 0;
      this.C = C2 | 0;
      this.D = D | 0;
      this.E = E | 0;
      this.F = F | 0;
      this.G = G2 | 0;
      this.H = H | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4)
        SHA256_W[i] = view.getUint32(offset, false);
      for (let i = 16; i < 64; i++) {
        const W15 = SHA256_W[i - 15];
        const W2 = SHA256_W[i - 2];
        const s0 = rotr(W15, 7) ^ rotr(W15, 18) ^ W15 >>> 3;
        const s1 = rotr(W2, 17) ^ rotr(W2, 19) ^ W2 >>> 10;
        SHA256_W[i] = s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16] | 0;
      }
      let { A, B, C: C2, D, E, F, G: G2, H } = this;
      for (let i = 0; i < 64; i++) {
        const sigma1 = rotr(E, 6) ^ rotr(E, 11) ^ rotr(E, 25);
        const T1 = H + sigma1 + Chi(E, F, G2) + SHA256_K[i] + SHA256_W[i] | 0;
        const sigma0 = rotr(A, 2) ^ rotr(A, 13) ^ rotr(A, 22);
        const T2 = sigma0 + Maj(A, B, C2) | 0;
        H = G2;
        G2 = F;
        F = E;
        E = D + T1 | 0;
        D = C2;
        C2 = B;
        B = A;
        A = T1 + T2 | 0;
      }
      A = A + this.A | 0;
      B = B + this.B | 0;
      C2 = C2 + this.C | 0;
      D = D + this.D | 0;
      E = E + this.E | 0;
      F = F + this.F | 0;
      G2 = G2 + this.G | 0;
      H = H + this.H | 0;
      this.set(A, B, C2, D, E, F, G2, H);
    }
    roundClean() {
      clean(SHA256_W);
    }
    destroy() {
      this.destroyed = true;
      this.set(0, 0, 0, 0, 0, 0, 0, 0);
      clean(this.buffer);
    }
  };
  var _SHA256 = class extends SHA2_32B {
    constructor() {
      super(32);
      // We cannot use array here since array allows indexing by variable
      // which means optimizer/compiler cannot use registers.
      __publicField(this, "A", SHA256_IV[0] | 0);
      __publicField(this, "B", SHA256_IV[1] | 0);
      __publicField(this, "C", SHA256_IV[2] | 0);
      __publicField(this, "D", SHA256_IV[3] | 0);
      __publicField(this, "E", SHA256_IV[4] | 0);
      __publicField(this, "F", SHA256_IV[5] | 0);
      __publicField(this, "G", SHA256_IV[6] | 0);
      __publicField(this, "H", SHA256_IV[7] | 0);
    }
  };
  var sha256 = /* @__PURE__ */ createHasher(
    () => new _SHA256(),
    /* @__PURE__ */ oidNist(1)
  );

  // node_modules/@noble/hashes/legacy.js
  var Rho160 = /* @__PURE__ */ Uint8Array.from([
    7,
    4,
    13,
    1,
    10,
    6,
    15,
    3,
    12,
    0,
    9,
    5,
    2,
    14,
    11,
    8
  ]);
  var Id160 = /* @__PURE__ */ (() => Uint8Array.from(new Array(16).fill(0).map((_, i) => i)))();
  var Pi160 = /* @__PURE__ */ (() => Id160.map((i) => (9 * i + 5) % 16))();
  var idxLR = /* @__PURE__ */ (() => {
    const L3 = [Id160];
    const R = [Pi160];
    const res = [L3, R];
    for (let i = 0; i < 4; i++)
      for (let j of res)
        j.push(j[i].map((k) => Rho160[k]));
    return res;
  })();
  var idxL = /* @__PURE__ */ (() => idxLR[0])();
  var idxR = /* @__PURE__ */ (() => idxLR[1])();
  var shifts160 = /* @__PURE__ */ [
    [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8],
    [12, 13, 11, 15, 6, 9, 9, 7, 12, 15, 11, 13, 7, 8, 7, 7],
    [13, 15, 14, 11, 7, 7, 6, 8, 13, 14, 13, 12, 5, 5, 6, 9],
    [14, 11, 12, 14, 8, 6, 5, 5, 15, 12, 15, 14, 9, 9, 8, 6],
    [15, 12, 13, 13, 9, 5, 8, 6, 14, 11, 12, 11, 8, 6, 5, 5]
  ].map((i) => Uint8Array.from(i));
  var shiftsL160 = /* @__PURE__ */ idxL.map((idx, i) => idx.map((j) => shifts160[i][j]));
  var shiftsR160 = /* @__PURE__ */ idxR.map((idx, i) => idx.map((j) => shifts160[i][j]));
  var Kl160 = /* @__PURE__ */ Uint32Array.from([
    0,
    1518500249,
    1859775393,
    2400959708,
    2840853838
  ]);
  var Kr160 = /* @__PURE__ */ Uint32Array.from([
    1352829926,
    1548603684,
    1836072691,
    2053994217,
    0
  ]);
  function ripemd_f(group, x, y, z) {
    if (group === 0)
      return x ^ y ^ z;
    if (group === 1)
      return x & y | ~x & z;
    if (group === 2)
      return (x | ~y) ^ z;
    if (group === 3)
      return x & z | y & ~z;
    return x ^ (y | ~z);
  }
  var BUF_160 = /* @__PURE__ */ new Uint32Array(16);
  var _RIPEMD160 = class extends HashMD {
    constructor() {
      super(64, 20, 8, true);
      __publicField(this, "h0", 1732584193 | 0);
      __publicField(this, "h1", 4023233417 | 0);
      __publicField(this, "h2", 2562383102 | 0);
      __publicField(this, "h3", 271733878 | 0);
      __publicField(this, "h4", 3285377520 | 0);
    }
    get() {
      const { h0, h1, h2, h3, h4 } = this;
      return [h0, h1, h2, h3, h4];
    }
    set(h0, h1, h2, h3, h4) {
      this.h0 = h0 | 0;
      this.h1 = h1 | 0;
      this.h2 = h2 | 0;
      this.h3 = h3 | 0;
      this.h4 = h4 | 0;
    }
    process(view, offset) {
      for (let i = 0; i < 16; i++, offset += 4)
        BUF_160[i] = view.getUint32(offset, true);
      let al = this.h0 | 0, ar = al, bl = this.h1 | 0, br = bl, cl = this.h2 | 0, cr = cl, dl = this.h3 | 0, dr = dl, el = this.h4 | 0, er = el;
      for (let group = 0; group < 5; group++) {
        const rGroup = 4 - group;
        const hbl = Kl160[group], hbr = Kr160[group];
        const rl = idxL[group], rr = idxR[group];
        const sl = shiftsL160[group], sr = shiftsR160[group];
        for (let i = 0; i < 16; i++) {
          const tl = rotl(al + ripemd_f(group, bl, cl, dl) + BUF_160[rl[i]] + hbl, sl[i]) + el | 0;
          al = el, el = dl, dl = rotl(cl, 10) | 0, cl = bl, bl = tl;
        }
        for (let i = 0; i < 16; i++) {
          const tr = rotl(ar + ripemd_f(rGroup, br, cr, dr) + BUF_160[rr[i]] + hbr, sr[i]) + er | 0;
          ar = er, er = dr, dr = rotl(cr, 10) | 0, cr = br, br = tr;
        }
      }
      this.set(this.h1 + cl + dr | 0, this.h2 + dl + er | 0, this.h3 + el + ar | 0, this.h4 + al + br | 0, this.h0 + bl + cr | 0);
    }
    roundClean() {
      clean(BUF_160);
    }
    destroy() {
      this.destroyed = true;
      clean(this.buffer);
      this.set(0, 0, 0, 0, 0);
    }
  };
  var ripemd160 = /* @__PURE__ */ createHasher(() => new _RIPEMD160());

  // node_modules/@scure/base/index.js
  function isBytes3(a) {
    return a instanceof Uint8Array || ArrayBuffer.isView(a) && a.constructor.name === "Uint8Array" && "BYTES_PER_ELEMENT" in a && a.BYTES_PER_ELEMENT === 1;
  }
  function isArrayOf(isString, arr) {
    if (!Array.isArray(arr))
      return false;
    if (arr.length === 0)
      return true;
    if (isString) {
      return arr.every((item) => typeof item === "string");
    } else {
      return arr.every((item) => Number.isSafeInteger(item));
    }
  }
  function astr(label, input) {
    if (typeof input !== "string")
      throw new TypeError(`${label}: string expected`);
    return true;
  }
  function anumber(n) {
    if (typeof n !== "number")
      throw new TypeError(`number expected, got ${typeof n}`);
    if (!Number.isSafeInteger(n))
      throw new RangeError(`invalid integer: ${n}`);
  }
  function aArr(input) {
    if (!Array.isArray(input))
      throw new TypeError("array expected");
  }
  function astrArr(label, input) {
    if (!isArrayOf(true, input))
      throw new TypeError(`${label}: array of strings expected`);
  }
  function anumArr(label, input) {
    if (!isArrayOf(false, input))
      throw new TypeError(`${label}: array of numbers expected`);
  }
  // @__NO_SIDE_EFFECTS__
  function chain(...args) {
    const id = (a) => a;
    const wrap = (a, b) => (c) => a(b(c));
    const encode = args.map((x) => x.encode).reduceRight(wrap, id);
    const decode = args.map((x) => x.decode).reduce(wrap, id);
    return { encode, decode };
  }
  // @__NO_SIDE_EFFECTS__
  function alphabet(letters) {
    const lettersA = typeof letters === "string" ? letters.split("") : letters;
    const len = lettersA.length;
    astrArr("alphabet", lettersA);
    const indexes = new Map(lettersA.map((l, i) => [l, i]));
    return {
      encode: (digits) => {
        aArr(digits);
        return digits.map((i) => {
          if (!Number.isSafeInteger(i) || i < 0 || i >= len)
            throw new Error(`alphabet.encode: digit index outside alphabet "${i}". Allowed: ${letters}`);
          return lettersA[i];
        });
      },
      decode: (input) => {
        aArr(input);
        return input.map((letter) => {
          astr("alphabet.decode", letter);
          const i = indexes.get(letter);
          if (i === void 0)
            throw new Error(`Unknown letter: "${letter}". Allowed: ${letters}`);
          return i;
        });
      }
    };
  }
  // @__NO_SIDE_EFFECTS__
  function join(separator = "") {
    astr("join", separator);
    return {
      encode: (from) => {
        astrArr("join.decode", from);
        return from.join(separator);
      },
      decode: (to) => {
        astr("join.decode", to);
        return to.split(separator);
      }
    };
  }
  function convertRadix(data, from, to) {
    if (from < 2)
      throw new RangeError(`convertRadix: invalid from=${from}, base cannot be less than 2`);
    if (to < 2)
      throw new RangeError(`convertRadix: invalid to=${to}, base cannot be less than 2`);
    aArr(data);
    if (!data.length)
      return [];
    let pos = 0;
    const res = [];
    const digits = Array.from(data, (d) => {
      anumber(d);
      if (d < 0 || d >= from)
        throw new Error(`invalid integer: ${d}`);
      return d;
    });
    const dlen = digits.length;
    while (true) {
      let carry = 0;
      let done = true;
      for (let i = pos; i < dlen; i++) {
        const digit = digits[i];
        const fromCarry = from * carry;
        const digitBase = fromCarry + digit;
        if (!Number.isSafeInteger(digitBase) || fromCarry / from !== carry || digitBase - digit !== fromCarry) {
          throw new Error("convertRadix: carry overflow");
        }
        const div = digitBase / to;
        carry = digitBase % to;
        const rounded = Math.floor(div);
        digits[i] = rounded;
        if (!Number.isSafeInteger(rounded) || rounded * to + carry !== digitBase)
          throw new Error("convertRadix: carry overflow");
        if (!done)
          continue;
        else if (!rounded)
          pos = i;
        else
          done = false;
      }
      res.push(carry);
      if (done)
        break;
    }
    for (let i = 0; i < data.length - 1 && data[i] === 0; i++)
      res.push(0);
    return res.reverse();
  }
  // @__NO_SIDE_EFFECTS__
  function radix(num) {
    anumber(num);
    const _256 = 2 ** 8;
    return {
      encode: (bytes) => {
        if (!isBytes3(bytes))
          throw new TypeError("radix.encode input should be Uint8Array");
        return convertRadix(Array.from(bytes), _256, num);
      },
      decode: (digits) => {
        anumArr("radix.decode", digits);
        return Uint8Array.from(convertRadix(digits, num, _256));
      }
    };
  }
  var genBase58 = /* @__NO_SIDE_EFFECTS__ */ (abc) => /* @__PURE__ */ chain(/* @__PURE__ */ radix(58), /* @__PURE__ */ alphabet(abc), /* @__PURE__ */ join(""));
  var base58 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ genBase58("123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"));

  // crypto.js
  function hexToBytes2(hex) {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
    }
    return bytes;
  }
  function deriveKeyData(hexPrivateKey) {
    try {
      const privKeyBytes = hexToBytes2(hexPrivateKey);
      const pubKey = getPublicKey(privKeyBytes, true);
      const sha256Hash = sha256(pubKey);
      const ripemd160Hash = ripemd160(sha256Hash);
      const payload = new Uint8Array(1 + ripemd160Hash.length);
      payload[0] = 0;
      payload.set(ripemd160Hash, 1);
      const hash1 = sha256(payload);
      const hash2 = sha256(hash1);
      const checksum = hash2.slice(0, 4);
      const finalPayload = new Uint8Array(payload.length + checksum.length);
      finalPayload.set(payload);
      finalPayload.set(checksum, payload.length);
      let pubKeyHex = "";
      for (let i = 0; i < pubKey.length; i++) {
        pubKeyHex += pubKey[i].toString(16).padStart(2, "0");
      }
      return {
        address: base58.encode(finalPayload),
        pubKeyHex
      };
    } catch (error) {
      return { address: "Invalid Key", pubKeyHex: "" };
    }
  }
  return __toCommonJS(crypto_exports);
})();
/*! Bundled license information:

@noble/secp256k1/index.js:
  (*! noble-secp256k1 - MIT License (c) 2019 Paul Miller (paulmillr.com) *)

@scure/base/index.js:
  (*! scure-base - MIT License (c) 2022 Paul Miller (paulmillr.com) *)
*/

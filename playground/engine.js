/* =============================================================================
   engine.js — the real blockchain. No simulation.
   - sha256(): genuine synchronous SHA-256 (Geraint Luff's compact impl), wrapped
     with UTF-8 normalization so any input hashes correctly.
   - PoW mining finds a nonce so the block hash starts with N hex zeros, batched
     across animation frames so the UI stays alive and the hashrate is real.
   - validateChain() recomputes every hash and checks the prev-hash links.
   Exposed on window.PG.
   ============================================================================= */
(function () {
  "use strict";

  /* ---- genuine synchronous SHA-256 (ASCII/latin1 in, hex out) ---- */
  function sha256(ascii) {
    function rightRotate(value, amount) { return (value >>> amount) | (value << (32 - amount)); }
    var mathPow = Math.pow;
    var maxWord = mathPow(2, 32);
    var i, j;
    var result = "";
    var words = [];
    var asciiBitLength = ascii.length * 8;

    var hash = sha256.h = sha256.h || [];
    var k = sha256.k = sha256.k || [];
    var primeCounter = k.length;

    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (i = 0; i < 313; i += candidate) { isComposite[i] = candidate; }
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }

    ascii += "\x80";
    while (ascii.length % 64 - 56) ascii += "\x00";
    for (i = 0; i < ascii.length; i++) {
      j = ascii.charCodeAt(i);
      if (j >> 8) return; // ASCII/latin1 only — callers pass utf8()-normalized text
      words[i >> 2] |= j << ((3 - i) % 4) * 8;
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;

    for (j = 0; j < words.length;) {
      var w = words.slice(j, j += 16);
      var oldHash = hash;
      hash = hash.slice(0, 8);

      for (i = 0; i < 64; i++) {
        var w15 = w[i - 15], w2 = w[i - 2];
        var a = hash[0], e = hash[4];
        var temp1 = hash[7] +
          (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
          ((e & hash[5]) ^ ((~e) & hash[6])) +
          k[i] +
          (w[i] = (i < 16) ? w[i] : (
            w[i - 16] +
            (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
            w[i - 7] +
            (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0);
        var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }

      for (i = 0; i < 8; i++) { hash[i] = (hash[i] + oldHash[i]) | 0; }
    }

    for (i = 0; i < 8; i++) {
      for (j = 3; j + 1; j--) {
        var b = (hash[i] >> (j * 8)) & 255;
        result += ((b < 16) ? 0 : "") + b.toString(16);
      }
    }
    return result;
  }

  /* normalize any JS string (incl. unicode) to a latin1 byte string for sha256 */
  function utf8(s) { return unescape(encodeURIComponent(String(s))); }
  function hash(str) { return sha256(utf8(str)); }

  /* ---- canonical serialization of a block (everything but the hash) ---- */
  function txLine(t) { return t.from + ">" + t.to + ":" + t.amount + (t.note ? "(" + t.note + ")" : ""); }
  function blockHeader(b) {
    return [
      b.index,
      b.ts,
      b.prevHash,
      (b.txs || []).map(txLine).join(";"),
      b.miner || "",
    ].join("|");
  }
  function blockBody(b) { return blockHeader(b) + "|" + b.nonce; }
  function hashBlock(b) { return hash(blockBody(b)); }
  function target(difficulty) { return "0".repeat(difficulty); }

  /* measure this machine's real SHA-256 throughput (hashes/sec) */
  function benchmark(ms) {
    ms = ms || 220;
    var n = 0;
    var t0 = performance.now();
    while (performance.now() - t0 < ms) {
      hash("benchmark|interchained|" + n);
      n++;
    }
    return n / ((performance.now() - t0) / 1000);
  }

  /* ---- ids / addresses ---- */
  function rnd(n) {
    var s = "";
    var hex = "0123456789abcdef";
    for (var i = 0; i < n; i++) s += hex[(Math.random() * 16) | 0];
    return s;
  }
  function makeAddress() { return "0x" + rnd(8); }
  function txId() { return "tx_" + rnd(6); }

  /* ---- mining: batched PoW so the tab stays responsive & hashrate is real ---- */
  function mineBlock(block, difficulty, opts) {
    opts = opts || {};
    var batch = opts.batch || 3000;
    var onProgress = opts.onProgress;
    var shouldStop = opts.shouldStop;
    var tgt = target(difficulty);
    var header = blockHeader(block);
    var nonce = 0;
    var t0 = performance.now();
    var lastUI = 0;

    return new Promise(function (resolve, reject) {
      function step() {
        if (shouldStop && shouldStop()) { reject({ cancelled: true }); return; }
        for (var i = 0; i < batch; i++) {
          var h = hash(header + "|" + nonce);
          if (h.slice(0, difficulty) === tgt) {
            var ms = performance.now() - t0;
            resolve({ nonce: nonce, hash: h, hashes: nonce + 1, ms: ms,
              hashrate: (nonce + 1) / (ms / 1000 || 0.001) });
            return;
          }
          nonce++;
        }
        var ms2 = performance.now() - t0;
        // Throttle UI updates to ~10/sec so the loop spends its time hashing,
        // not re-rendering React — keeps the measured hashrate honest & fast.
        if (onProgress && ms2 - lastUI > 90) {
          lastUI = ms2;
          onProgress({
            nonce: nonce, hashes: nonce, sampleHash: h,
            hashrate: nonce / (ms2 / 1000 || 0.001), ms: ms2,
          });
        }
        // setTimeout (not requestAnimationFrame) so mining keeps running even
        // when the tab is backgrounded — rAF is paused while hidden.
        setTimeout(step, 0);
      }
      step();
    });
  }

  /* ---- chain validity: recompute every hash, verify PoW + prev links ---- */
  function validateChain(blocks, difficulty) {
    return blocks.map(function (b, i) {
      var d = (b.difficulty != null) ? b.difficulty : difficulty;
      var tgt = target(d);
      var recomputed = hashBlock(b);
      var hashValid = recomputed === b.hash;
      var powValid = b.hash.slice(0, d) === tgt;
      var linkValid = i === 0 ? b.prevHash === GENESIS_PREV : b.prevHash === blocks[i - 1].hash;
      return {
        index: b.index,
        difficulty: d,
        hashValid: hashValid,
        powValid: powValid,
        linkValid: linkValid,
        recomputed: recomputed,
        ok: hashValid && powValid && linkValid,
      };
    });
  }
  function chainValid(blocks, difficulty) {
    return validateChain(blocks, difficulty).every(function (s) { return s.ok; });
  }

  var GENESIS_PREV = "0".repeat(64);

  /* ---- balances: replay coinbase + transfers across the whole chain ---- */
  function computeBalances(blocks, wallets) {
    var bal = {};
    wallets.forEach(function (w) { bal[w.id] = 0; });
    blocks.forEach(function (b) {
      (b.txs || []).forEach(function (t) {
        if (t.from === "COINBASE") {
          if (bal[t.to] == null) bal[t.to] = 0;
          bal[t.to] += t.amount;
        } else {
          if (bal[t.from] == null) bal[t.from] = 0;
          if (bal[t.to] == null) bal[t.to] = 0;
          bal[t.from] -= t.amount;
          bal[t.to] += t.amount;
        }
      });
    });
    return bal;
  }

  window.PG = {
    sha256: sha256,
    hash: hash,
    utf8: utf8,
    hashBlock: hashBlock,
    blockBody: blockBody,
    blockHeader: blockHeader,
    target: target,
    benchmark: benchmark,
    mineBlock: mineBlock,
    validateChain: validateChain,
    chainValid: chainValid,
    computeBalances: computeBalances,
    makeAddress: makeAddress,
    txId: txId,
    rnd: rnd,
    GENESIS_PREV: GENESIS_PREV,
  };

  /* ---- self-test: prove the SHA-256 is the real thing ---- */
  try {
    var t1 = sha256(utf8("abc"));
    var t2 = sha256(utf8(""));
    var ok1 = t1 === "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad";
    var ok2 = t2 === "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    console.log("[PG] SHA-256 self-test:", ok1 && ok2 ? "PASS ✓" : "FAIL ✗", { abc: t1 });
  } catch (e) { console.warn("[PG] self-test error", e); }
})();

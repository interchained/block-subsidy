/* =============================================================================
   daa-engine.js — the difficulty-adjustment simulator that powers the booth.

   It does two real things, side by side, on the SAME hashrate:

   1) DarkGravityWave3-Nova (ITC)  — a faithful JS port of the C++ retarget:
      12/24-block weighted window, height-aware clamps, an emergency trigger
      evaluated BEFORE clamping, graceful decay, and median smoothing of both
      the solve-time and the difficulty window. It retargets EVERY block.
      (We model targets as plain floats instead of arith_uint256 / nBits — the
      256-bit fixed-point encoding is irrelevant to the *behaviour*, which is
      what the booth is teaching. Every branch of the original logic is kept.)

   2) Bitcoin (legacy) — the textbook 2016-block epoch retarget: it only adjusts
      once every 2016 blocks, by the ratio of actual vs. target epoch time,
      clamped to a 4x move. Between epochs it does nothing at all.

   Normalisation: target T0 = 1 and hashrate H0 = 1 are the reference. Expected
   solve time = spacing / (T * H), so at equilibrium T = 1/H and the displayed
   difficulty (= 1/T) settles at exactly H. That keeps the chart legible: set
   hashrate to 10x and ITC difficulty climbs to 10; Bitcoin sits frozen.

   Exposed on window.DAA.
   ============================================================================= */
(function () {
  "use strict";

  /* ---- default consensus-ish params (heights chosen for a legible story) ---- */
  function defaultParams() {
    return {
      spacing: 60,            // ITC target block time (s)  — 1 minute
      btcSpacing: 600,        // Bitcoin target block time (s) — 10 minutes
      btcEpoch: 2016,         // Bitcoin retarget interval (blocks)
      fork3Height: 50,        // emergency-trigger logic active from here
      fork5Height: 100,       // "v9" Nova: 12-block window + decay + smoothing
      sha256ForkHeight: 200,  // Yespower -> SHA-256 migration (height-based)
      powLimitYespower: 8,    // easiest target in the Yespower era
      powLimitSha256: 4,      // easiest target in the SHA-256 era
      minSolveTime: 12,       // seconds (matches the C++ constant)
    };
  }

  /* which proof-of-work algorithm is live at a given height (height-based fork) */
  function powInfoForHeight(h, params) {
    params = params || defaultParams();
    const post = h >= params.sha256ForkHeight;
    return {
      algo: post ? "SHA-256" : "Yespower",
      post: post,
      powLimit: post ? params.powLimitSha256 : params.powLimitYespower,
      blurb: post
        ? "ASIC-class SHA-256. Reactivated by height — every node swaps in lockstep at the fork block, no flag-day coordination."
        : "Yespower: CPU-friendly, memory-hard, ASIC-resistant. The bootstrap era — fair launch on commodity hardware.",
    };
  }
  function isPostSha256Fork(h, params) { return h >= (params || defaultParams()).sha256ForkHeight; }

  /* ============================================================================
     DarkGravityWave3-Nova — faithful port. `blocks` is the chain so far, oldest
     first; blocks[last] is pindexLast. Each block = { height, target, time }.
     Returns the new TARGET for block `nextHeight`.
     ============================================================================ */
  function dgwNova(blocks, params, nextHeight, log) {
    params = params || defaultParams();
    const n = blocks.length;
    const nPastBlocks = (nextHeight >= params.fork5Height) ? 12 : 24;
    const limit = powInfoForHeight(nextHeight, params).powLimit;

    if (nextHeight < nPastBlocks || n < 2) return limit;

    // weighted average of the past targets (DGW's signature recursive weighting)
    let pastAvg = 0, pastAvgPrev = 0;
    let actualTimespan = 0, lastBlockTime = 0;
    for (let i = 0; i < nPastBlocks; i++) {
      const idx = n - 1 - i;
      if (idx < 0) break;
      const cur = blocks[idx].target;
      if (i === 0) pastAvg = cur;
      else pastAvg = ((pastAvgPrev * i) + cur) / (i + 1);
      pastAvgPrev = pastAvg;
      if (lastBlockTime > 0) actualTimespan += lastBlockTime - blocks[idx].time;
      lastBlockTime = blocks[idx].time;
    }

    const targetTimespan = nPastBlocks * params.spacing;
    const v9 = nextHeight >= params.fork5Height;

    const minTimespanClamp = targetTimespan / 3;
    const maxTimespanClamp = targetTimespan * 3;
    const emergencyClamp = v9 ? (targetTimespan / 3) : (targetTimespan / 6);
    const minSolveClamp = v9 ? (targetTimespan / 4) : (targetTimespan / 8);
    const minSolveTime = params.minSolveTime;

    const last = blocks[n - 1], prev = blocks[n - 2];
    const actualSolveTime = last.time - prev.time;
    const unclampedActualTimespan = actualTimespan;

    // rolling median of solve times (Fork 8) — only used for logging in the C++,
    // but we compute it faithfully so the booth can surface it.
    let rollingSolveTime = actualSolveTime;
    if (v9) {
      const solveTimes = [];
      for (let i = 0; i < Math.min(nPastBlocks, 9); i++) {
        const a = n - 1 - i, b = n - 2 - i;
        if (b < 0) break;
        solveTimes.push(blocks[a].time - blocks[b].time);
      }
      solveTimes.sort((x, y) => x - y);
      rollingSolveTime = solveTimes[Math.floor(solveTimes.length / 2)];
    }

    // emergency trigger — evaluated BEFORE the normal clamps
    const triggered = v9
      ? (actualSolveTime < 2 * minSolveTime && unclampedActualTimespan < targetTimespan / 6)
      : (actualSolveTime < minSolveTime || unclampedActualTimespan < targetTimespan / 6);

    if (triggered && nextHeight >= params.fork3Height) {
      actualTimespan = Math.min(actualTimespan, Math.min(emergencyClamp, minSolveClamp));
    }

    // height-aware clamp (skipped on an emergency trigger in the v9 era)
    if (v9) {
      if (!triggered) {
        if (actualTimespan < minTimespanClamp) actualTimespan = minTimespanClamp;
        if (actualTimespan > maxTimespanClamp) actualTimespan = maxTimespanClamp;
      }
    } else {
      if (actualTimespan < minTimespanClamp) actualTimespan = minTimespanClamp;
      if (actualTimespan > maxTimespanClamp) actualTimespan = maxTimespanClamp;
    }

    // graceful decay — dampens how fast difficulty eases when blocks run slow.
    // (The original literally writes `nextHeight >= v9`, with v9 a bool; we
    //  preserve that — it's true for every real height.)
    let decayFactor = 1.0;
    if (nextHeight >= (v9 ? 1 : 0) && actualSolveTime > params.spacing) {
      const multiplier = Math.min(6.0, actualSolveTime / params.spacing);
      decayFactor = Math.min(Math.pow(multiplier, 0.45), 2.0);
    }

    // median smoothing of the difficulty window (Fork 9)
    let difficultySmoothing = pastAvg;
    if (v9) {
      const pastDiffs = [];
      for (let i = 0; i < Math.min(nPastBlocks, 5); i++) {
        const a = n - 1 - i;
        if (a - 1 < 0) break;
        pastDiffs.push(blocks[a].target);
      }
      pastDiffs.sort((x, y) => x - y);
      difficultySmoothing = pastDiffs[Math.floor(pastDiffs.length / 2)];
    }

    // final difficulty (target) with the asymmetric decay-from-baseline
    let baseline = difficultySmoothing * actualTimespan / targetTimespan;
    let newTarget = baseline;
    if (nextHeight >= (v9 ? 1 : 0) && decayFactor > 1.0) {
      const diffToPrevious = baseline > difficultySmoothing ? (baseline - difficultySmoothing) : 0;
      newTarget = baseline - (diffToPrevious / decayFactor);
    }

    // powLimit cap (and the post-SHA-256 Yespower band cap, simplified)
    if (newTarget > limit) newTarget = limit;
    if (newTarget <= 0) newTarget = baseline > 0 ? baseline : limit;

    if (log) log({ actualSolveTime, rollingSolveTime, actualTimespan, triggered, decayFactor, v9, nPastBlocks });
    return newTarget;
  }

  /* exponential solve time (PoW is a Poisson process) with a tiny floor */
  function expSolve(mean, rng) {
    const u = Math.max(1e-9, (rng || Math.random)());
    return Math.max(0.5, -mean * Math.log(u));
  }

  /* ============================================================================
     Simulator. Drives one ITC block per tick; Bitcoin advances in the same
     simulated wall-clock so the two chains share miners. Hashrate is shared.
     ============================================================================ */
  function makeSim(opts) {
    opts = opts || {};
    const params = Object.assign(defaultParams(), opts.params || {});
    const rng = opts.rng || Math.random;
    const startHeight = opts.startHeight != null ? opts.startHeight : 320; // SHA-256 era, Nova fully on
    let H = opts.hashrate != null ? opts.hashrate : 1;
    // PoW solve times are exponentially distributed; for a legible teaching chart
    // we damp that variance toward the mean (jitter=1 is pure exponential, 0 is
    // perfectly regular). The retarget maths (dgwNova) is untouched.
    const jitter = opts.jitter != null ? opts.jitter : 0.55;
    function drawSolve(mean) {
      const u = Math.max(1e-9, rng());
      const e = -Math.log(u);                 // unit exponential
      const f = jitter * e + (1 - jitter);    // mean-preserving damp
      return Math.max(0.5, mean * f);
    }

    // ITC chain (oldest..newest). Seed an equilibrium window for the start hashrate.
    const itc = [];
    const Teq = 1 / H;
    const win = 30;
    for (let i = 0; i < win; i++) {
      const height = startHeight - (win - 1) + i;
      itc.push({ height, target: Teq, time: i * params.spacing, solve: params.spacing });
    }
    let clock = (win - 1) * params.spacing; // simulated seconds at the tip

    // Bitcoin chain — tracked compactly (difficulty is flat for whole epochs).
    const btc = {
      target: 1,                 // difficulty = 1/target, starts at 1
      blocksTotal: startHeight,  // pretend it's the same age
      epochCount: 0,             // blocks into the current epoch
      lastEpochSeconds: 0,       // accumulated time in the current epoch
      retargets: 0,
      lastStep: null,            // {height, from, to} of the last adjustment
      meanNow: params.btcSpacing / (1 * H),
    };
    btc.meanNow = params.btcSpacing / (btc.target * H);

    function powLimitNow(height) { return powInfoForHeight(height, params).powLimit; }

    function setHashrate(h) { H = Math.max(0.05, h); }
    function hashrate() { return H; }

    // advance Bitcoin by `dt` simulated seconds (deterministic block accrual)
    function advanceBtc(dt) {
      let remaining = dt;
      // guard against pathological tiny means when H is huge
      let guard = 0;
      while (remaining > 0 && guard < 100000) {
        guard++;
        const mean = params.btcSpacing / (btc.target * H);
        btc.meanNow = mean;
        const toEpochEnd = params.btcEpoch - btc.epochCount; // whole blocks left
        const timeToEpochEnd = toEpochEnd * mean - (btc.lastEpochSeconds % mean || 0);
        if (remaining < timeToEpochEnd) {
          const blocks = remaining / mean;
          btc.epochCount += blocks;
          btc.blocksTotal += blocks;
          btc.lastEpochSeconds += remaining;
          remaining = 0;
        } else {
          // finish the epoch and retarget
          btc.blocksTotal += toEpochEnd;
          btc.lastEpochSeconds += timeToEpochEnd;
          remaining -= timeToEpochEnd;
          const actualEpoch = params.btcEpoch * mean;            // ~= lastEpochSeconds
          const targetEpoch = params.btcEpoch * params.btcSpacing;
          let ratio = actualEpoch / targetEpoch;                 // <1 fast, >1 slow
          ratio = Math.max(0.25, Math.min(4, ratio));            // Bitcoin's 4x clamp
          const from = 1 / btc.target;
          btc.target = btc.target * ratio;
          const to = 1 / btc.target;
          btc.retargets++;
          btc.lastStep = { atSecond: clock + (dt - remaining), from, to };
          btc.epochCount = 0;
          btc.lastEpochSeconds = 0;
        }
      }
    }

    // one ITC block; Bitcoin advances by the same elapsed seconds
    function step() {
      const nextHeight = itc[itc.length - 1].height + 1;
      let dbg = null;
      const target = dgwNova(itc, params, nextHeight, (d) => { dbg = d; });
      const mean = params.spacing / (target * H);   // spacing * T0 * H0 / (T*H), refs=1
      const solve = drawSolve(mean);
      clock += solve;
      const algo = powInfoForHeight(nextHeight, params).algo;
      itc.push({ height: nextHeight, target, time: clock, solve, algo, dbg });
      if (itc.length > 400) itc.shift();
      advanceBtc(solve);
      return itc[itc.length - 1];
    }

    // recent slice for the chart / readouts
    function view(window) {
      window = window || 60;
      const slice = itc.slice(-window);
      const tip = itc[itc.length - 1];
      // rolling actual block time — mean of the last several solves (unbiased,
      // and it visibly spikes during a shock then returns to target)
      const recentSolves = itc.slice(-8).map((b) => b.solve);
      const itcRollingSolve = recentSolves.length
        ? recentSolves.reduce((a, b) => a + b, 0) / recentSolves.length
        : params.spacing;
      const itcDiff = 1 / tip.target;
      const btcDiff = 1 / btc.target;
      const btcMean = params.btcSpacing / (btc.target * H);
      const blocksLeft = Math.max(0, params.btcEpoch - btc.epochCount);
      return {
        slice, tip, H,
        itcDiff, itcRollingSolve, itcTarget: tip.target, itcAlgo: tip.algo,
        itcDbg: tip.dbg,
        btcDiff, btcMean, btcBlocksLeft: blocksLeft,
        btcEpochProgress: btc.epochCount / params.btcEpoch,
        btcSecondsToRetarget: blocksLeft * btcMean,
        btcLastStep: btc.lastStep, btcRetargets: btc.retargets,
        clock, height: tip.height,
        post: isPostSha256Fork(tip.height, params),
      };
    }

    return {
      params, step, view, setHashrate, hashrate,
      get itc() { return itc; },
      get btc() { return btc; },
      get clock() { return clock; },
    };
  }

  /* ============================================================================
     GetBlockSubsidy — faithful port of the C++ issuance schedule.
     Returns the block reward in *satoshis* (integer), exactly like the source;
     blockSubsidyITC() is the convenience float. The schedule has four phases and,
     crucially, a PERMANENT floor — issuance never reaches zero (unlike Bitcoin's
     halving to nothing). That perpetual tail is what funds eco-grants forever.
     ============================================================================ */
  const SUBSIDY = {
    COIN: 100000000,
    rampUpEnd: 259200,     // ~ phase 1 end
    peakEnd: 518400,       // ~ phase 2 end
    decayRate: 0.0000038405,
    decayBase: 1.10301990, // decay coefficient
    floor: 0.10301990,     // permanent minimum reward (ITC)
  };
  function blockSubsidy(nHeight) {
    const S = SUBSIDY;
    let reward;
    if (nHeight <= S.rampUpEnd) {
      const progress = nHeight / S.rampUpEnd;     // linear ramp-up
      reward = 0.678 + (1.5 * progress);          // 0.678 → 2.178 ITC
    } else if (nHeight <= S.peakEnd) {
      reward = 1.5;                               // flat peak
    } else {
      reward = S.decayBase * Math.exp(-S.decayRate * (nHeight - S.peakEnd)); // exp decay
    }
    if (reward < S.floor) reward = S.floor;       // permanent floor
    return Math.floor(reward * S.COIN);           // satoshis
  }
  function blockSubsidyITC(nHeight) { return blockSubsidy(nHeight) / SUBSIDY.COIN; }

  /* which issuance phase a height sits in (for the teaching readout) */
  function subsidyPhase(nHeight) {
    const S = SUBSIDY;
    if (nHeight <= S.rampUpEnd) return { n: 1, key: "ramp", label: "Ramp-up", blurb: "Linear climb from 0.678 toward 2.178 ITC — rewarding the earliest blocks while the network finds its feet." };
    if (nHeight <= S.peakEnd) return { n: 2, key: "peak", label: "Flat peak", blurb: "A steady 1.5 ITC plateau — predictable issuance through the growth phase." };
    // is it still decaying or has it hit the floor?
    const decayReward = S.decayBase * Math.exp(-S.decayRate * (nHeight - S.peakEnd));
    if (decayReward > S.floor) return { n: 3, key: "decay", label: "Exponential decay", blurb: "A smooth exponential taper — issuance cools without a jarring halving cliff." };
    return { n: 4, key: "floor", label: "Perpetual floor", blurb: "Locked at 0.10301990 ITC forever. Security and eco-grants stay funded for good — issuance never hits zero." };
  }
  /* height at which the decay reaches the permanent floor */
  function subsidyFloorHeight() {
    const S = SUBSIDY;
    return Math.ceil(S.peakEnd + Math.log(S.decayBase / S.floor) / S.decayRate);
  }
  /* cumulative supply minted through `nHeight` — EXACT to the satoshi.
     Sums the real per-block subsidy (with the same integer truncation the chain
     uses), accelerated by a cached coarse prefix table so scrubbing stays cheap.
     No approximation: cumulativeSupply(h) == Σ GetBlockSubsidy(0..h) / COIN. */
  let _prefix = null, _prefixMax = 0;
  const _STRIDE = 1000;
  function _buildPrefix(maxH) {
    const cells = Math.ceil(maxH / _STRIDE) + 2;
    const arr = new Float64Array(cells);   // arr[k] = satoshis minted in blocks 0..k*STRIDE-1
    let acc = 0;
    const top = cells * _STRIDE;
    for (let h = 0; h < top; h++) {
      if (h % _STRIDE === 0) arr[h / _STRIDE] = acc;
      acc += blockSubsidy(h);              // integer satoshis, exactly as consensus
    }
    _prefix = arr; _prefixMax = top;
  }
  function cumulativeSupplySat(nHeight) {
    nHeight = Math.max(0, Math.floor(nHeight));
    if (!_prefix || _prefixMax < nHeight + 1) _buildPrefix(Math.max(nHeight + 1, 1400000));
    const base = Math.floor(nHeight / _STRIDE);
    let acc = _prefix[base];               // exact sum of blocks 0..base*STRIDE-1
    for (let h = base * _STRIDE; h <= nHeight; h++) acc += blockSubsidy(h);
    return acc;                            // satoshis
  }
  function cumulativeSupply(nHeight) { return cumulativeSupplySat(nHeight) / SUBSIDY.COIN; }

  window.DAA = {
    defaultParams,
    powInfoForHeight,
    isPostSha256Fork,
    dgwNova,
    expSolve,
    makeSim,
    blockSubsidy,
    blockSubsidyITC,
    subsidyPhase,
    subsidyFloorHeight,
    cumulativeSupply,
    SUBSIDY,
  };

  /* sanity check on load */
  try {
    const s = makeSim({ hashrate: 1 });
    for (let i = 0; i < 40; i++) s.step();
    const v = s.view();
    console.log("[DAA] sim self-test — ITC diff", v.itcDiff.toFixed(2),
      "rolling solve", v.itcRollingSolve.toFixed(1) + "s (target " + s.params.spacing + "s)");
  } catch (e) { console.warn("[DAA] self-test error", e); }
})();
